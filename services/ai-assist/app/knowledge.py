"""Hybrid RAG: scoped approved FAQs provide facts; the optional LLM gives natural language."""
import re
import unicodedata
from functools import lru_cache
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .schemas import ChatRequest
from .llm import grounded_reply, casual_reply

FALLBACK = "Mình chưa tìm được thông tin đã được cửa hàng xác nhận về nội dung này. Mình có thể chuyển bạn tới nhân viên hỗ trợ."


def normalized(text: str) -> str:
    plain = unicodedata.normalize("NFD", text.casefold())
    return "".join(ch for ch in plain if unicodedata.category(ch) != "Mn").replace("đ", "d")


def smalltalk(text: str) -> str | None:
    value = re.sub(r"[^\w\s]", " ", normalized(text)).strip()
    value = re.sub(r"\s+", " ", value)
    if re.fullmatch(r"(xin )?(chao|hi|hello|hey)( ban| ad| shop| greenplus| a| nha| moi nguoi)?", value):
        return "Chào bạn! Mình là trợ lý GreenPlus. Bạn cần hỗ trợ sản phẩm, đơn hàng, giao hàng hay chính sách của cửa hàng?"
    if re.fullmatch(r"(cam on|thanks|thank you)( ban| nhieu| nha| a)?", value):
        return "Rất vui được hỗ trợ bạn! Nếu còn câu hỏi, bạn cứ nhắn mình nhé."
    if re.fullmatch(r"(tam biet|bye|goodbye|hen gap lai)( nha| ban)?", value):
        return "Chào bạn, hẹn gặp lại tại GreenPlus!"
    if re.fullmatch(r"(ban la ai|ban co the lam gi|tro ly la gi|giup gi duoc|help)", value):
        return "Mình là trợ lý GreenPlus, hỗ trợ giải đáp thông tin từ kho tri thức đã được duyệt của cửa hàng. Mình có thể hướng dẫn về sản phẩm, đặt hàng, giao vận và chính sách; mình không tự thay đổi đơn hàng hay phê duyệt khuyến mãi."
    return None



BUSINESS_HINTS = (
    "cua hang", "san pham", "don hang", "don cua", "doi tra", "doi hang", "tra hang",
    "hoan tien", "khuyen mai", "giam gia", "gia ban", "bao gia", "shipper", "giao hang",
    "van chuyen", "thanh toan", "phi", "chinh sach", "quy dinh", "dieu kien", "ton kho",
    "hang hoa", "mua hang", "gio hang", "chi nhanh", "hoa don", "hoan don", "ma don",
    "voucher", "loyalty", "tich diem", "khieu nai", "bao hanh", "hoan tra", "auth",
    "nhan vien", "quan ly", "manager", "admin", "greenplus a", "greenplus b",
    "nguyen lieu", "cong thuc", "thuc don", "dinh duong", "lo hang", "han su dung",
    "bao mat", "tai khoan", "dang nhap", "dat hang", "bao cao", "du bao", "phan quyen",
)


def business_question(body: ChatRequest) -> bool:
    combined = normalized(body.question)
    # An elliptical question after a business turn must keep the earlier safety classification.
    if len(body.question) < 70 and body.history:
        previous = next((turn.content for turn in reversed(body.history) if turn.role == "user"), "")
        if previous:
            combined += " " + normalized(previous)
    return any(re.search(r"(?<!\w)" + re.escape(hint) + r"(?!\w)", combined) for hint in BUSINESS_HINTS)

def retrieval_question(body: ChatRequest) -> str:
    """Attach last user turn to short elliptical follow-ups, never cross actor/store boundaries."""
    q = body.question.strip()
    if len(q) < 100 and re.match(r"^(the con|vay con|con|the|vay|neu|truong hop)\b", normalized(q)):
        previous = next((turn.content for turn in reversed(body.history) if turn.role == "user"), "")
        if previous:
            return previous[:350] + " " + q
    return q


@lru_cache(maxsize=32)
def _cached_index(store_id: str, documents: tuple[str, ...]):
    """A bounded per-store cache; editing approved FAQ changes the cache key automatically."""
    vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5),
                                 sublinear_tf=True, max_features=14000)
    matrix = vectorizer.fit_transform(documents)
    return vectorizer, matrix


def ranked_sources(query, knowledge, store_id=""):
    if not knowledge:
        return []
    # Include store_id AND approved text in the cache key: no cross-tenant reuse.
    documents = tuple((item.question + " ") * 3 + item.answer[:1800] for item in knowledge)
    try:
        vectorizer, matrix = _cached_index(str(store_id), documents)
        scores = cosine_similarity(vectorizer.transform([query]), matrix)[0]
    except ValueError:
        return []
    return sorted(((float(score), index) for index, score in enumerate(scores)), reverse=True)


async def answer(body: ChatRequest):
    greeting = smalltalk(body.question)
    if greeting:
        return {"answer": greeting, "sources": [], "confidence": 0.0, "mode": "smalltalk", "handoff": False}
    if not body.knowledge:
        if not business_question(body):
            general = await casual_reply(body.question, history=body.history)
            if general:
                return {"answer": general, "sources": [], "confidence": 0.0, "mode": "llm_general", "handoff": False}
        return {"answer": "Cửa hàng chưa có tài liệu phù hợp được duyệt. Vui lòng liên hệ nhân viên hỗ trợ để xác nhận thông tin.",
                "sources": [], "confidence": 0.0, "mode": "no_verified_knowledge", "handoff": True}
    ranked = ranked_sources(retrieval_question(body), body.knowledge, body.store_id)
    score, best = ranked[0] if ranked else (0.0, 0)
    if score < 0.145:
        if not business_question(body):
            general = await casual_reply(body.question, history=body.history)
            if general:
                return {"answer": general, "sources": [], "confidence": 0.0, "mode": "llm_general", "handoff": False}
        return {"answer": FALLBACK, "sources": [], "confidence": round(score, 4),
                "mode": "no_verified_match", "handoff": True}
    matched = body.knowledge[best]
    relevant = [body.knowledge[index] for value, index in ranked[:3]
                if value >= max(0.11, score * 0.55)]
    generated = await grounded_reply(body.question, matched.answer, history=body.history,
        sources=[{"question": entry.question, "answer": entry.answer} for entry in relevant])
    if generated == "__NOT_GROUNDED__":
        return {"answer": FALLBACK, "sources": [], "confidence": round(score, 4),
                "mode": "no_verified_match", "handoff": True}
    return {"answer": generated or matched.answer,
            "sources": [entry.id for entry in relevant] if generated else [matched.id],
            "confidence": round(score, 4),
            "mode": "hybrid_rag_llm" if generated else "retrieval",
            "handoff": False}
