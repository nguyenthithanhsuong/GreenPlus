from datetime import datetime, timedelta, timezone
from .schemas import PromotionInput

def recommend(body: PromotionInput):
    if body.available == 0:
        return {"eligible": False, "reason": "Không còn tồn kho có thể bán."}
    expiry = body.expiry_days
    predicted_sell = body.daily_demand * max(1, min(7, expiry or 7))
    if expiry is not None and expiry <= 0:
        return {"eligible": False, "reason": "Lô đã hết hạn, không thể khuyến mãi."}
    if expiry is not None and expiry <= 3:
        discount = 25
    elif expiry is not None and expiry <= 7:
        discount = 15
    elif body.daily_demand > 0 and body.available > 30 * body.daily_demand:
        discount = 10
    else:
        return {"eligible": False, "reason": "Chưa đủ tín hiệu cận hạn hoặc tồn dư."}
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=min(7, max(1, expiry or 7)))
    return {"eligible": True, "store_id": str(body.store_id), "product_id": str(body.product_id),
            "batch_id": str(body.batch_id) if body.batch_id else None,
            "suggested_discount_pct": discount, "suggested_start_at": now.isoformat(),
            "suggested_end_at": end.isoformat(), "expected_sell_through": round(min(100.0, 100 * (predicted_sell / body.available)), 2),
            "reason": "Đề xuất quy tắc dựa trên tồn kho, hạn sử dụng và nhu cầu dự báo. Cần Manager duyệt.",
            "model_version": "promotion-rules-v1", "confidence": body.confidence, "approval_required": True}
