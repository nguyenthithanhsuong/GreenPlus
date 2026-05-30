# API Examples & Data Flow

Complete reference for all Supabase operations with real-world examples.

---

## 1. PRODUCTS

### GET: Fetch All Products
**What You Send**: Nothing (parameters in URL/query)
**What You Get Back**:
```json
{
  "data": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "category_id": "550e8400-e29b-41d4-a716-446655440001",
      "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Organic Tomatoes",
      "description": "Fresh locally grown tomatoes",
      "unit": "kg",
      "image_url": "https://example.com/tomato.jpg",
      "status": "active",
      "created_at": "2026-03-19T10:30:00.000Z",
      "CATEGORIES": {
        "name": "Vegetables"
      },
      "SUPPLIERS": {
        "name": "Farm ABC"
      }
    },
    {...}
  ],
  "error": null
}
```

### POST: Create Product
**Input Required**:
```json
{
  "category_id": "550e8400-e29b-41d4-a716-446655440001",
  "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Organic Lettuce",
  "description": "Fresh lettuce from local farm",
  "unit": "kg",
  "image_url": "https://example.com/lettuce.jpg"
}
```

**Returns**:
```json
{
  "data": {
    "product_id": "550e8400-e29b-41d4-a716-446655440003",
    "category_id": "550e8400-e29b-41d4-a716-446655440001",
    "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Organic Lettuce",
    "description": "Fresh lettuce from local farm",
    "unit": "kg",
    "image_url": "https://example.com/lettuce.jpg",
    "status": "active",
    "created_at": "2026-03-19T11:45:00.000Z"
  },
  "error": null
}
```

### PUT: Update Product
**Input Required**:
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "inactive",
  "name": "Organic Lettuce - Premium"
}
```

**Returns**: Updated product object with all fields

---

## 2. BATCHES (Lô hàng)

### GET: Fetch All Batches
**Returns**:
```json
{
  "data": [
    {
      "batch_id": "650e8400-e29b-41d4-a716-446655440000",
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
      "harvest_date": "2026-03-15",
      "expire_date": "2026-04-15",
      "quantity": 500,
      "qr_code": "BATCH-2026-03-001",
      "status": "available"
    }
  ]
}
```

### POST: Create Batch
**Input Required**:
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
  "harvest_date": "2026-03-18",
  "expire_date": "2026-04-18",
  "quantity": 250,
  "qr_code": "BATCH-2026-03-002"
}
```

**Returns**: New batch object with all fields

---

## 3. ORDERS

### GET: Fetch User Orders
**Input**: `user_id` (UUID)

**Returns**:
```json
{
  "data": [
    {
      "order_id": "750e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440100",
      "order_date": "2026-03-19T09:00:00.000Z",
      "status": "delivering",
      "total_amount": 150000,
      "delivery_address": "123 Nguyen Hue, HCMC",
      "delivery_fee": 15000,
      "note": "Ring doorbell twice",
      "created_at": "2026-03-19T09:00:00.000Z",
      "ORDER_ITEMS": [
        {
          "order_item_id": "850e8400-e29b-41d4-a716-446655440000",
          "product_id": "550e8400-e29b-41d4-a716-446655440000",
          "batch_id": "650e8400-e29b-41d4-a716-446655440000",
          "quantity": 3,
          "price": 45000,
          "PRODUCTS": {
            "name": "Organic Tomatoes",
            "unit": "kg"
          },
          "BATCHES": {
            "harvest_date": "2026-03-15",
            "expire_date": "2026-04-15"
          }
        }
      ],
      "PAYMENTS": {
        "payment_id": "950e8400-e29b-41d4-a716-446655440000",
        "method": "momo",
        "status": "paid",
        "amount": 165000
      },
      "DELIVERIES": {
        "delivery_id": "a50e8400-e29b-41d4-a716-446655440000",
        "status": "delivering",
        "pickup_time": "2026-03-19T09:30:00.000Z",
        "delivery_time": null
      }
    }
  ]
}
```

### POST: Create Order
**Input Required**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440100",
  "total_amount": 150000,
  "delivery_address": "123 Nguyen Hue, HCMC",
  "delivery_fee": 15000,
  "note": "Ring doorbell twice"
}
```

**Returns**: New order with empty ORDER_ITEMS (add items separately)

### PUT: Update Order Status
**Input Required**:
```json
{
  "order_id": "750e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

**Status Values**: `pending` → `confirmed` → `preparing` → `delivering` → `completed` or `cancelled`

---

## 4. INVENTORY (Tồn kho)

### GET: Low Stock Alert
**Returns**: Items with quantity < 50
```json
{
  "data": [
    {
      "inventory_id": "b50e8400-e29b-41d4-a716-446655440000",
      "batch_id": "650e8400-e29b-41d4-a716-446655440000",
      "quantity_available": 25,
      "quantity_reserved": 10,
      "last_updated": "2026-03-19T10:30:00.000Z",
      "BATCHES": {
        "product_id": "550e8400-e29b-41d4-a716-446655440000",
        "expire_date": "2026-04-15",
        "PRODUCTS": {
          "name": "Organic Tomatoes"
        }
      }
    }
  ]
}
```

### POST: Add Stock (Nhập hàng)
**Input Required**:
```json
{
  "batch_id": "650e8400-e29b-41d4-a716-446655440000",
  "quantity": 500,
  "note": "Received from supplier Farm ABC"
}
```

**Returns**: Transaction record created

### POST: Remove Stock (Xuất hàng)
**Input Required**:
```json
{
  "batch_id": "650e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "type": "out",
  "note": "Order #750e8400... shipped"
}
```

**Type Values**: `in` (incoming), `out` (outgoing), `adjustment` (correction)

---

## 5. CART

### GET: User Cart
**Input**: `user_id` (UUID)

**Returns**:
```json
{
  "data": {
    "cart_id": "c50e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440100",
    "created_at": "2026-03-19T08:00:00.000Z",
    "updated_at": "2026-03-19T11:30:00.000Z",
    "CART_ITEMS": [
      {
        "cart_item_id": "d50e8400-e29b-41d4-a716-446655440000",
        "product_id": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 2,
        "note": "Pick fresher batch if available",
        "created_at": "2026-03-19T11:30:00.000Z",
        "PRODUCTS": {
          "name": "Organic Tomatoes",
          "unit": "kg"
        }
      }
    ]
  }
}
```

### POST: Add to Cart
**Input Required**:
```json
{
  "cart_id": "c50e8400-e29b-41d4-a716-446655440000",
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 2,
  "note": "Pick fresher batch if available"
}
```

**Returns**: New cart item object

---

## 6. REVIEWS

### GET: Product Reviews
**Input**: `product_id` (UUID)

**Returns**:
```json
{
  "data": [
    {
      "review_id": "e50e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440100",
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "rating": 5,
      "comment": "Great quality! Very fresh and delicious.",
      "created_at": "2026-03-18T15:00:00.000Z",
      "USERS": {
        "name": "Nguyen Van A"
      }
    }
  ]
}
```

### POST: Add Review
**Input Required**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440100",
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "rating": 5,
  "comment": "Great quality! Very fresh and delicious."
}
```

**Rating Values**: 1-5 stars

---

## 7. GROUP BUYS

### GET: Open Group Buys
**Returns**:
```json
{
  "data": [
    {
      "group_id": "f50e8400-e29b-41d4-a716-446655440000",
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "leader_id": "550e8400-e29b-41d4-a716-446655440100",
      "target_quantity": 100,
      "current_quantity": 35,
      "min_quantity": 50,
      "discount_price": 40000,
      "deadline": "2026-03-25T23:59:59.000Z",
      "status": "open",
      "PRODUCTS": { "name": "Organic Tomatoes" },
      "USERS": { "name": "Tran Thi B" },
      "GROUP_BUY_MEMBERS": [
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440101",
          "quantity": 10,
          "joined_at": "2026-03-19T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

### POST: Join Group Buy
**Input Required**:
```json
{
  "group_id": "f50e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440100",
  "quantity": 10
}
```

**Returns**: Member record created

---

## 8. SEARCH & FILTER

### GET: Search Products
**Input Required**: `searchTerm` (string), optional `category_id`

**Returns**: Filtered product array (same format as Products GET)

### GET: Orders by Date Range
**Input Required**: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)

**Returns**: Orders within date range with all details

---

## Error Response Format

All errors follow this format:
```json
{
  "data": null,
  "error": {
    "message": "Field 'user_id' is required",
    "code": "INVALID_REQUEST",
    "status": 400
  }
}
```

---

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `INVALID_REQUEST` | Missing required field | Check input fields marked with * |
| `NOT_FOUND` | Record doesn't exist | Verify ID is correct |
| `DUPLICATE_KEY` | Unique constraint violated | Value already exists |
| `INVALID_FORMAT` | Data type mismatch | Ensure correct format (UUID, date, etc.) |
| `UNAUTHORIZED` | Auth token invalid | Check connection and credentials |
| `PERMISSION_DENIED` | User can't access this data | Check RLS policies |

**Last Updated**: March 19, 2026
