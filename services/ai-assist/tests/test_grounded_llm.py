import asyncio
from unittest.mock import AsyncMock,patch
from uuid import uuid4
from app.schemas import ChatRequest
from app.knowledge import answer
from app.llm import grounded_reply
from app.settings import Settings


def test_cited_retrieval_with_no_provider():
    request=ChatRequest(store_id=uuid4(),role="customer",question="Chính sách đổi trả có bao nhiêu ngày?", knowledge=[{"id":"faq-1","question":"Chính sách đổi trả có bao nhiêu ngày?","answer":"Đổi trả trong 7 ngày theo điều kiện đã công bố."}])
    with patch("app.llm.settings", Settings("test","","","")):
        result=asyncio.run(answer(request))
    assert result["sources"] == ["faq-1"]
    assert result["mode"] == "retrieval"
    assert "7 ngày" in result["answer"]


def test_no_unapproved_fact_when_no_knowledge():
    request=ChatRequest(store_id=uuid4(),role="shipper",question="Mã OTP giao hàng?",knowledge=[])
    with patch("app.knowledge.grounded_reply",new_callable=AsyncMock) as mocked:
        result=asyncio.run(answer(request))
        mocked.assert_not_called()
    assert result["handoff"] is True


def test_llm_rejects_insecure_endpoint():
    with patch("app.llm.settings", Settings("test","http://internal-service/v1/chat/completions","key","model")):
        assert asyncio.run(grounded_reply("abc","verified answer")) is None
