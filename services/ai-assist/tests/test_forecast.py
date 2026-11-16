from datetime import date, timedelta
from uuid import uuid4
from app.schemas import ForecastRequest, InventoryLine, SaleDay
from app.forecast import forecast

def test_forecast_uses_only_previous_dates():
    today = date(2026, 11, 15)
    history = [SaleDay(day=today-timedelta(days=index), quantity=5) for index in range(70, 0, -1)]
    item = InventoryLine(product_id=uuid4(), name="Táo", available=15, history=history)
    result = forecast(ForecastRequest(store_id=uuid4(), items=[item], as_of=today))
    first = result["items"][0]
    assert first["training_days"] == 70
    assert first["predicted_daily_units"] >= 0
    assert first["stockout_date"] is not None
    assert first["model_version"] == "ridge-daily-v1"

def test_no_history_does_not_fake_confidence():
    result = forecast(ForecastRequest(store_id=uuid4(), items=[InventoryLine(product_id=uuid4(), name="Cam", available=40)]))
    assert result["items"][0]["confidence"] == "low"
    assert result["items"][0]["model_version"] == "no-history"
