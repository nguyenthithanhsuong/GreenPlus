from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .schemas import ChatRequest
from .llm import grounded_reply

async def answer(body: ChatRequest):
    knowledge = body.knowledge
    if not knowledge:
        return {"answer": "Chưa có tài liệu được duyệt cho cửa hàng này. Vui lòng liên hệ nhân viên hỗ trợ.",
                "sources": [], "confidence": 0.0, "mode": "no_verified_knowledge", "handoff": True}
    corpus = [entry.question + " " + entry.answer for entry in knowledge]
    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, max_features=6000)
        index = vectorizer.fit_transform(corpus + [body.question])
        similarities = cosine_similarity(index[-1], index[:-1])[0]
        best = int(similarities.argmax())
        score = float(similarities[best])
    except ValueError:
        score, best = 0.0, 0
    if score < 0.12:
        return {"answer": "Mình chưa tìm được câu trả lời được xác minh. Bạn có thể chuyển yêu cầu cho nhân viên hỗ trợ.",
                "sources": [], "confidence": round(score, 4), "mode": "retrieval", "handoff": True}
    matched = knowledge[best]
    generated = await grounded_reply(body.question, matched.answer) if score >= 0.35 else None
    return {"answer": generated or matched.answer, "sources": [matched.id], "confidence": round(score, 4),
            "mode": "grounded_llm" if generated else "retrieval", "handoff": score < 0.25}
