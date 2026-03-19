# Supabase Playground

Interactive testing environment for all Supabase operations in GreenPlus.

## Features

✨ **Live Operations** - Test all CRUD operations against your Supabase database
📊 **8 Categories** - Products, Batches, Orders, Inventory, Cart, Reviews, Group Buys, Search & Filter
📋 **Operation Details** - See query code, input fields, and expected return structure
✅ **Instant Results** - Execute operations and see real-time results

## Categories & Operations

### 1. **Products** 
- `selectAll` - Get all active products with category and supplier info (SELECT)
- `insert` - Add a new product to catalog (INSERT)
- `update` - Update product status or details (UPDATE)

### 2. **Batches** (Lô hàng)
- `selectAll` - Get all available batches (SELECT)
- `insert` - Create new batch with harvest/expire dates (INSERT)

### 3. **Orders**
- `selectUserOrders` - Get all orders for a user with items and payment (SELECT)
- `insert` - Create new order (INSERT)
- `updateStatus` - Update order status (UPDATE)

### 4. **Inventory** (Tồn kho)
- `selectLow` - Get low stock items (less than 50 units) (SELECT)
- `addStock` - Record stock entry/incoming (INSERT)
- `removeStock` - Record stock removal/adjustment (INSERT)

### 5. **Cart**
- `getCart` - Get user's cart with all items (SELECT)
- `addToCart` - Add item to cart (INSERT)

### 6. **Reviews**
- `getProductReviews` - Get all reviews for a product (SELECT)
- `addReview` - Add product review (INSERT)

### 7. **Group Buys**
- `getOpenGroupBuys` - Get all open group buy campaigns (SELECT)
- `joinGroupBuy` - Join a group buy campaign (INSERT)

### 8. **Search & Filter**
- `searchProducts` - Search products by name (SELECT)
- `ordersByDateRange` - Get orders within a date range (SELECT)

---

## How to Use

1. **Select a Category** - Click a category on the left sidebar
2. **Choose an Operation** - Click an operation name in the main area
3. **Review Operation Details**:
   - 📋 See the query code
   - 📝 Fill in required input fields (marked with *)
   - 📤 Check the expected data structure returned
4. **Execute** - Click "▶ Execute Operation"
5. **View Results** - See the returned data or error message

---

## Input Types Reference

| Type | Example | Notes |
|------|---------|-------|
| `UUID` | `550e8400-e29b-41d4-a716-446655440000` | Copy from existing records |
| `VARCHAR(n)` | `"text"` | Text up to n characters |
| `INTEGER` | `500` | Whole numbers |
| `NUMERIC(10,2)` | `50000` | Decimal numbers |
| `DATE` | `2026-03-15` | YYYY-MM-DD format |
| `TEXT` | `"Description..."` | Long text |

---

## Expected Return Structures

### SELECT (GET) Returns
Array of objects matching the table schema:
```json
[
  {
    "product_id": "uuid",
    "name": "Product Name",
    "status": "active",
    ...
  }
]
```

### INSERT (POST) Returns
The newly created object with all fields:
```json
{
  "product_id": "uuid",
  "name": "New Product",
  "status": "active",
  "created_at": "2026-03-19T10:30:00Z",
  ...
}
```

### UPDATE (PUT) Returns
The updated object:
```json
{
  "product_id": "uuid",
  "status": "inactive",
  ...
}
```

---

## Tips

💡 **Need Real UUIDs?**
- Run a SELECT query first to get actual UUIDs from the database
- For Products, run `Products > selectAll` to copy product_id values

💡 **Testing INSERT?**
- Fill in all required fields (marked with *)
- Check the expected return to see all fields that will be created

💡 **Testing if Connection Works?**
- Start with `Products > selectAll`
- If you see data, the Supabase connection is working

💡 **Error Codes?**
- Check the error message - it will tell you which field is missing or invalid
- Verify field types match (e.g., numbers vs text)

---

## Database Schema Reference

See [SUPABASE.md](../SUPABASE.md) for complete schema documentation including:
- All 22 table definitions
- Field constraints and defaults
- Relationship diagrams
- Advanced query examples
- Row Level Security (RLS) policies

---

**Last Updated**: March 19, 2026
