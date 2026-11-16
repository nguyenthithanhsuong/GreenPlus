import os
from uuid import uuid4
from fastapi.testclient import TestClient
os.environ["AI_SERVICE_KEY"] = "test-only-secret-key-for-the-ai-service-2026"
from app.main import app

client = TestClient(app)
key = {"X-AI-Service-Key": "test-only-secret-key-for-the-ai-service-2026"}

def test_all_private_endpoints_require_key():
    for name in ["forecast", "promotion", "chat", "recipes", "complaints"]:
        result = client.post("/v1/" + name, json={})
        assert result.status_code == 401

def test_validated_chat_does_not_invent_policy():
    result = client.post("/v1/chat", headers=key, json={"store_id":str(uuid4()),"role":"customer","question":"Chính sách đổi trả là gì?","knowledge":[]})
    assert result.status_code == 200
    assert result.json()["handoff"]
    assert result.json()["sources"] == []

def test_promotions_require_approval():
    result = client.post("/v1/promotion", headers=key, json={"store_id":str(uuid4()),"product_id":str(uuid4()),"available":20,"expiry_days":2,"daily_demand":1.2,"confidence":"low"})
    assert result.status_code == 200
    assert result.json()["approval_required"]
    assert result.json()["suggested_discount_pct"] == 25

def test_recipe_and_classification():
    ingredients = client.post("/v1/recipes", headers=key,json={"store_id":str(uuid4()),"ingredients":["rau","tỏi"],"servings":2})
    assert ingredients.status_code == 200
    assert ingredients.json()["recipes"][0]["name"] == "Rau xào tỏi"
    complaint = client.post("/v1/complaints", headers=key,json={"store_id":str(uuid4()),"text":"Thực phẩm bị mốc, cần giải quyết"})
    assert complaint.json()["priority"] == "high"
