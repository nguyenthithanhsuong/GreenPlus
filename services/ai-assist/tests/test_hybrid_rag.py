import asyncio
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from app.schemas import ChatRequest
from app.knowledge import answer, retrieval_question, ranked_sources
from app.settings import Settings


def make(question, knowledge=None, history=None, role="customer", level="high", locale="vi"):
    return ChatRequest(store_id=uuid4(), role=role, question=question,
        knowledge=knowledge or [], history=history or [], level=level, locale=locale)


def faq(id, question, answer):
    return {"id":id, "question":question, "answer":answer}


def test_greeting_is_fast_even_without_any_knowledge_or_llm():
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock) as llm:
        result = asyncio.run(answer(make("Xin chào!")))
        llm.assert_not_awaited()
    assert result["mode"] == "smalltalk"
    assert result["handoff"] is False
    assert result["sources"] == []


def test_unknown_store_policy_is_never_guessed_by_llm():
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock) as llm:
        result = asyncio.run(answer(make("Chính sách hoàn tiền tối đa bao nhiêu ngày?")))
        llm.assert_not_awaited()
    assert result["handoff"] is True
    assert result["sources"] == []


def test_approved_faq_paraphrase_is_used_and_llm_receives_bounded_context():
    request = make("Tôi muốn biết cách đổi trả hàng?", [
        faq("faq-returns", "Chính sách đổi trả sản phẩm như thế nào?", "Khách hàng gửi khiếu nại từ đơn hàng; điều kiện đổi trả được cửa hàng xác nhận."),
        faq("faq-delivery", "Tôi liên hệ shipper như thế nào?", "Vào chi tiết đơn hàng để trao đổi với shipper.")
    ], history=[{"role":"user", "content":"Tôi vừa nhận đơn."},
                {"role":"assistant","content":"Mình có thể hướng dẫn dựa trên FAQ đã duyệt."}])
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock, return_value="Bạn có thể gửi yêu cầu từ đơn hàng.") as llm:
        result = asyncio.run(answer(request))
    assert result["sources"][0] == "faq-returns"
    assert result["mode"] == "hybrid_rag_llm"
    assert llm.await_args.kwargs["history"] == request.history
    assert all("question" in x and "answer" in x for x in llm.await_args.kwargs["sources"])


def test_llm_outage_falls_back_to_verified_faq_answer():
    answer_text = "Bạn có thể theo dõi trạng thái đơn tại lịch sử đơn hàng của mình."
    request = make("Xem trạng thái đơn hàng ở đâu?", [faq("faq-order", "Xem trạng thái đơn hàng ở đâu?", answer_text)])
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock, return_value=None):
        result = asyncio.run(answer(request))
    assert result["mode"] == "retrieval" and result["answer"] == answer_text


def test_followup_uses_previous_user_question_and_ignores_previous_assistant_answer():
    request = make("Thế còn hàng đông lạnh?", history=[
        {"role":"user","content":"Tôi muốn hỏi về đổi trả sản phẩm"},
        {"role":"assistant","content":"Không có dữ liệu về thanh toán"}
    ])
    context = retrieval_question(request)
    assert "đổi trả" in context and "thanh toán" not in context


def test_llm_rejects_http_even_if_all_keys_are_set():
    from app.llm import llm_configured
    with patch("app.llm.settings", Settings("test", "http://ai.internal", "key", "model")):
        assert not llm_configured()


def test_llm_explicitly_rejects_unsupported_specific_fact():
    request = make("Chính sách hoàn tiền là bao nhiêu ngày?", [
        faq("faq-returns", "Quy trình đổi trả", "Cửa hàng tiếp nhận yêu cầu đổi trả từ đơn hàng.")
    ])
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock, return_value="__NOT_GROUNDED__"):
        result = asyncio.run(answer(request))
    assert result["handoff"] is True
    assert result["sources"] == []


def test_general_llm_is_allowed_without_knowledge_but_not_for_store_policies():
    with patch("app.knowledge.casual_reply", new_callable=AsyncMock, return_value="Mình ổn, cảm ơn bạn!") as mock:
        result = asyncio.run(answer(make("Hôm nay bạn thế nào?")))
        assert result["mode"] == "llm_general"
        mock.assert_awaited_once()
    with patch("app.knowledge.casual_reply", new_callable=AsyncMock) as mock:
        result = asyncio.run(answer(make("Phí giao hàng của GreenPlus hôm nay bao nhiêu?")))
        assert result["handoff"] is True
        mock.assert_not_awaited()


def test_openai_compatible_provider_receives_only_bounded_approved_context():
    from app.llm import grounded_reply
    captured = {}

    class Response:
        def raise_for_status(self): pass
        def json(self): return {"choices":[{"message":{"content":"Cách xử lý được nêu trong FAQ."}}]}

    class Client:
        def __init__(self, **kwargs):
            assert kwargs["follow_redirects"] is False
            assert kwargs["timeout"] <= 7
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, **kwargs):
            captured["url"] = url
            captured["messages"] = kwargs["json"]["messages"]
            captured["headers"] = kwargs["headers"]
            return Response()

    with patch("app.llm.settings", Settings("test", "https://api.groq.com/openai/v1/chat/completions", "dummy-key", "openai/gpt-oss-20b")), \
         patch("app.llm.httpx.AsyncClient", Client):
        result = asyncio.run(grounded_reply("Tôi xem đơn ở đâu?", "Vào lịch sử đơn hàng.",
            sources=[{"question":"Xem đơn ở đâu?","answer":"Vào lịch sử đơn hàng."}]))
    assert result == "Cách xử lý được nêu trong FAQ."
    assert captured["url"].startswith("https://")
    assert captured["headers"]["Authorization"].startswith("Bearer ")
    assert "Vào lịch sử đơn hàng" in captured["messages"][-1]["content"]
    assert "CHỈ được dùng" in captured["messages"][0]["content"]


def test_history_is_bounded_by_request_schema():
    from pydantic import ValidationError
    try:
        make("Xin chào", history=[{"role":"user", "content":"Hello"}]*11)
    except ValidationError:
        return
    assert False, "history must have maximum 10 turns"
