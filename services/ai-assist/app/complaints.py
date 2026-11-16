from .schemas import ComplaintRequest

RULES = [
    ("safety", "high", ("ngộ độc", "dị ứng", "mốc", "thối", "nhiễm khuẩn", "an toàn")),
    ("delivery", "medium", ("giao trễ", "chậm giao", "tài xế", "shipper", "thất lạc")),
    ("quality", "medium", ("hư", "dập", "không tươi", "hết hạn", "sai chất lượng")),
    ("payment", "high", ("trừ tiền", "hoàn tiền", "thanh toán", "thu tiền")),
    ("order", "medium", ("thiếu hàng", "sai đơn", "nhầm sản phẩm", "giao nhầm")),
]

def classify(body: ComplaintRequest):
    text = body.text.casefold()
    for category, priority, tokens in RULES:
        matched = [token for token in tokens if token in text]
        if matched:
            return {"category": category, "priority": priority, "confidence": 0.65,
                    "mode": "transparent_rules", "requires_human_review": True, "signals": matched}
    return {"category": "other", "priority": "normal", "confidence": 0.2,
            "mode": "transparent_rules", "requires_human_review": True, "signals": []}
