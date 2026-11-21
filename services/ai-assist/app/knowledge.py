"""Hybrid RAG: scoped approved FAQs provide facts; the optional LLM gives natural language."""
import re
import unicodedata
from functools import lru_cache
from .schemas import ChatRequest
from .llm import grounded_reply, casual_reply

FALLBACK = "Mình chưa tìm được thông tin đã được cửa hàng xác nhận về nội dung này. Mình có thể chuyển bạn tới nhân viên hỗ trợ."
FALLBACK_EN = "I couldn't find verified store information for this question. I can refer you to store support."

# Reject matches based only on common suffixes such as "hàng" in "khách hàng".
STOP_WORDS = frozenset("toi ban minh cua la co khong va cho voi trong nhu nao the nao duoc gi ve hoi hay mot may den khi nhu the ra sao tai nhung cac thuong ban hay shop greenplus hang khach minh chinh sach quy dinh".split())

def key_terms(text: str) -> set[str]:
    return {term for term in re.findall(r"[a-z0-9]+", normalized(text))
            if len(term) >= 2 and term not in STOP_WORDS}

def relevant_question(query: str, faq_question: str, score: float) -> bool:
    q = key_terms(query)
    faq = key_terms(faq_question)
    overlap = q & faq
    if not overlap:
        return False
    # Two shared content terms are a good minimum for ordinary questions.
    # A single exact distinctive word can be used only for very short questions
    # with a much higher cosine score.
    return len(overlap) >= 2 or (min(len(q), len(faq)) <= 1 and score >= 0.55)



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
    "order", "orders", "store", "opening hours", "hours", "shipping", "delivery",
    "payment", "refund", "price", "inventory", "return", "purchase", "schedule",
    "database", "customer account", "track package",
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
    from sklearn.feature_extraction.text import TfidfVectorizer
    vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5),
                                 sublinear_tf=True, max_features=14000)
    matrix = vectorizer.fit_transform(documents)
    return vectorizer, matrix


def fast_faq_sources(query, knowledge):
    """Cheap strict FAQ retrieval without importing ML libraries (Low mode)."""
    terms = key_terms(query)
    matches = []
    for index, item in enumerate(knowledge):
        title_terms = key_terms(item.question)
        common = terms & title_terms
        if not common:
            continue
        score = 0.65 * len(common) / max(1, len(terms)) + 0.35 * len(common) / max(1, len(title_terms))
        if normalized(query).strip() == normalized(item.question).strip():
            score = 1.0
        if len(common) >= 2 or (min(len(terms), len(title_terms)) <= 1 and score >= 0.9):
            matches.append((round(score, 4), index))
    return sorted(matches, key=lambda pair: (-pair[0], pair[1]))


def ranked_sources(query, knowledge, store_id=""):
    if not knowledge:
        return []
    # Include store_id AND approved text in the cache key: no cross-tenant reuse.
    documents = tuple((item.question + " ") * 3 + item.answer[:1800] for item in knowledge)
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        vectorizer, matrix = _cached_index(str(store_id), documents)
        scores = cosine_similarity(vectorizer.transform([query]), matrix)[0]
    except ValueError:
        return []
    return sorted(((float(score), index) for index, score in enumerate(scores)), reverse=True)


async def answer(body: ChatRequest):
    """Three explicit levels: local FAQ, local retrieval/composition, online LLM.

    The service never fetches orders or database rows: trusted, store-scoped data
    must be supplied by a separately authorized server-side adapter in the future.
    """
    level = body.level
    english = body.locale == "en"
    greeting = smalltalk(body.question)
    if greeting:
        if english:
            text = normalized(body.question)
            if any(word in text for word in ("thanks", "thank you", "cam on")):
                greeting = "You're welcome! Let me know if you need more help."
            elif any(word in text for word in ("bye", "goodbye", "tam biet")):
                greeting = "Goodbye, and thanks for visiting GreenPlus!"
            else:
                greeting = "Hello! I'm the GreenPlus assistant. How can I help you?"
        return {"answer": greeting, "sources": [], "confidence": 0.0, "mode": "smalltalk", "level": level, "handoff": False}

    if not body.knowledge:
        if level == "high" and not business_question(body):
            general = await casual_reply(body.question, history=body.history, locale=body.locale)
            if general:
                return {"answer": general, "sources": [], "confidence": 0.0, "mode": "llm_general", "level": level, "handoff": False}
        return {"answer": ("No approved store articles are available. Please contact store support." if english
                          else "Cửa hàng chưa có tài liệu phù hợp được duyệt. Vui lòng liên hệ nhân viên hỗ trợ để xác nhận thông tin."),
                "sources": [], "confidence": 0.0, "mode": "no_verified_knowledge", "level": level, "handoff": True}

    query = retrieval_question(body)
    if level == "low":
        ranked = fast_faq_sources(query, body.knowledge)
        qualified = ranked
    else:
        ranked = ranked_sources(query, body.knowledge, body.store_id)
        qualified = [(score, index) for score, index in ranked
                     if score >= 0.145 and relevant_question(query, body.knowledge[index].question, score)]
    score, best = qualified[0] if qualified else (0.0, 0)
    if not qualified:
        if level == "high" and not business_question(body):
            general = await casual_reply(body.question, history=body.history, locale=body.locale)
            if general:
                return {"answer": general, "sources": [], "confidence": 0.0, "mode": "llm_general", "level": level, "handoff": False}
        return {"answer": FALLBACK_EN if english else FALLBACK, "sources": [],
                "confidence": round(ranked[0][0], 4) if ranked else 0.0,
                "mode": "no_verified_match", "level": level, "handoff": True}

    matched = body.knowledge[best]
    relevant = [body.knowledge[index] for value, index in qualified[:3]
                if value >= max(0.15, score * 0.55)]

    if level == "low":
        return {"answer": matched.answer, "sources": [matched.id], "confidence": round(score, 4),
                "mode": "retrieval", "level": level, "handoff": False}

    if level == "medium":
        # Local-only RAG: rank approved FAQs, then produce an explicit, bounded
        # natural-language wrapper. No external provider/LLM, no unsupported facts.
        lead = "According to the store's approved information: " if english else "Theo thông tin cửa hàng đã duyệt: "
        return {"answer": lead + matched.answer, "sources": [matched.id],
                "confidence": round(score, 4), "mode": "rag_local", "level": level, "handoff": False}

    # High is the only level allowed to send bounded approved FAQ text online.
    generated = await grounded_reply(body.question, matched.answer, history=body.history,
        sources=[{"question": entry.question, "answer": entry.answer} for entry in relevant], locale=body.locale)
    if generated == "__NOT_GROUNDED__":
        return {"answer": FALLBACK_EN if english else FALLBACK, "sources": [],
                "confidence": round(score, 4), "mode": "no_verified_match", "level": level, "handoff": True}
    return {"answer": generated or matched.answer,
            "sources": [entry.id for entry in relevant] if generated else [matched.id],
            "confidence": round(score, 4),
            "mode": "hybrid_rag_llm" if generated else "retrieval",
            "level": level, "handoff": False,
            "degraded": generated is None}
