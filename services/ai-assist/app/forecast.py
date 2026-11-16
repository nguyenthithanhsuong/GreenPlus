from datetime import date, timedelta
from statistics import mean, median
import numpy as np
from sklearn.linear_model import Ridge
from .schemas import ForecastRequest

VERSION = "ridge-daily-v1"

def _feature(day: date, previous: list[float]):
    return [1.0, day.weekday() / 6, (day.weekday() in (5, 6)) * 1.0,
            mean(previous[-7:]) if previous else 0.0,
            mean(previous[-14:]) if previous else 0.0]

def _predict(history, today, horizon):
    series = {entry.day: entry.quantity for entry in history if entry.day < today}
    if not series:
        return 0.0, 0, None, "no-history", "low"
    start = min(series)
    days = [start + timedelta(days=offset) for offset in range((today - start).days)]
    values = [float(series.get(day, 0)) for day in days]
    if len(values) < 21 or sum(values) == 0:
        expected = max(0.0, median(values[-14:]))
        return expected, len(values), None, "moving-median", "low"
    features = np.asarray([_feature(day, values[:index]) for index, day in enumerate(days) if index >= 7], dtype=float)
    targets = np.asarray(values[7:], dtype=float)
    split = max(10, int(len(targets) * 0.8))
    split = min(split, len(targets) - 1)
    validation_model = Ridge(alpha=2.0, positive=True)
    validation_model.fit(features[:split], targets[:split])
    estimated = np.clip(validation_model.predict(features[split:]), 0, None)
    mae = float(np.mean(np.abs(estimated - targets[split:])))
    model = Ridge(alpha=2.0, positive=True)
    model.fit(features, targets)
    simulated = list(values)
    predicted = []
    for index in range(horizon):
        next_day = today + timedelta(days=index + 1)
        estimate = max(0.0, float(model.predict(np.asarray([_feature(next_day, simulated)], dtype=float))[0]))
        predicted.append(estimate)
        simulated.append(estimate)
    avg = mean(predicted)
    confidence = "high" if len(values) >= 56 and mae < max(1.0, avg * 0.35) else "medium"
    return avg, len(values), round(mae, 3), VERSION, confidence

def forecast(body: ForecastRequest):
    today = body.as_of or date.today()
    output = []
    for item in body.items:
        daily, sample_size, mae, model, confidence = _predict(item.history, today, body.horizon)
        days_to_expiry = (item.expires_at - today).days if item.expires_at else None
        stockout_days = int(item.available / daily) if daily > 0 else None
        alerts = []
        if item.available <= max(3, round(daily * 3)):
            alerts.append("low_stock")
        if days_to_expiry is not None and 0 <= days_to_expiry <= 7 and item.available > 0:
            alerts.append("near_expiry")
        if daily > 0 and item.available > daily * 30:
            alerts.append("overstock")
        output.append({
            "store_id": str(body.store_id), "product_id": str(item.product_id),
            "batch_id": str(item.batch_id) if item.batch_id else None,
            "name": item.name, "available": item.available,
            "days_to_expiry": days_to_expiry,
            "predicted_daily_units": round(daily, 3),
            "predicted_14d_units": round(daily * 14, 2),
            "stockout_date": (today + timedelta(days=stockout_days)).isoformat() if stockout_days is not None else None,
            "model_version": model, "training_days": sample_size,
            "validation_mae": mae, "confidence": confidence, "alerts": alerts,
        })
    return {"store_id": str(body.store_id), "as_of": today.isoformat(), "horizon": body.horizon,
            "items": output, "status": "estimated", "source": "store-scoped order history and live inventory"}
