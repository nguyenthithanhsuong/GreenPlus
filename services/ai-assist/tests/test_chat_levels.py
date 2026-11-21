import asyncio
from unittest.mock import AsyncMock, patch
from uuid import uuid4
import pytest
from pydantic import ValidationError
from app.schemas import ChatRequest
from app.knowledge import answer

FAQ = [{"id":"returns-1", "question":"Chính sách đổi trả hàng như thế nào?",
        "answer":"Cửa hàng tiếp nhận đổi trả trong vòng 7 ngày."}]

def question(text="Chính sách đổi trả hàng thế nào?", level="low", locale="vi", knowledge=FAQ):
    return ChatRequest(store_id=uuid4(),role="customer",question=text,level=level,locale=locale,knowledge=knowledge)

def test_low_and_medium_never_contact_online_llm():
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock) as llm, \
         patch("app.knowledge.casual_reply", new_callable=AsyncMock) as casual:
        low = asyncio.run(answer(question(level="low")))
        medium = asyncio.run(answer(question(level="medium")))
        assert low["mode"] == "retrieval"
        assert medium["mode"] == "rag_local"
        assert "7 ngày" in low["answer"] and "7 ngày" in medium["answer"]
        llm.assert_not_awaited()
        casual.assert_not_awaited()

def test_high_calls_online_only_with_approved_sources():
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock, return_value="Đổi trả 7 ngày") as llm:
        result = asyncio.run(answer(question(level="high")))
        assert result["mode"] == "hybrid_rag_llm"
        assert result["sources"] == ["returns-1"]
        llm.assert_awaited_once()

def test_false_match_with_unrelated_question_must_handoff():
    unrelated = question("Giờ mở cửa của cửa hàng là mấy giờ?", knowledge=FAQ)
    with patch("app.knowledge.grounded_reply", new_callable=AsyncMock) as llm:
        result = asyncio.run(answer(unrelated))
        assert result["handoff"] is True
        assert result["sources"] == []
        llm.assert_not_awaited()

def test_low_never_general_chat_with_provider_even_when_no_faq():
    with patch("app.knowledge.casual_reply", new_callable=AsyncMock) as llm:
        result = asyncio.run(answer(question("Hôm nay bạn thế nào?", knowledge=[])))
        assert result["handoff"] is True
        llm.assert_not_awaited()

def test_invalid_modes_and_locales_rejected():
    with pytest.raises(ValidationError): question(level="unrestricted")
    with pytest.raises(ValidationError): question(locale="xx")

def test_english_fallback_is_available():
    result=asyncio.run(answer(question("When does the store open?", locale="en")))
    assert result["handoff"] is True
    assert "verified" in result["answer"]

def test_high_provider_cannot_invent_numeric_policies():
    from app.llm import grounded_reply
    from app.settings import Settings
    class FakeResponse:
        def raise_for_status(self): pass
        def json(self):return {"choices":[{"message":{"content":"You have 30 days to return a product."}}]}
    class FakeClient:
        def __init__(self, **kwargs):pass
        async def __aenter__(self):return self
        async def __aexit__(self,*args):return False
        async def post(self,*args,**kwargs):return FakeResponse()
    with patch("app.llm.settings", Settings("test", "https://provider.example/v1/chat/completions", "key", "model")), \
         patch("app.llm.httpx.AsyncClient", FakeClient):
        result=asyncio.run(grounded_reply("How many days?","Returns within 7 days",locale="en"))
    assert result == "__NOT_GROUNDED__"
