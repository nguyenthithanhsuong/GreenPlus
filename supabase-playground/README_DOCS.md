# 📚 Supabase GreenPlus Documentation & Playground

Complete reference for your Supabase database with interactive testing playground.

---

## 📂 Files Overview

### ✅ **SUPABASE.md** - Complete Database Reference
The definitive guide to your Supabase setup containing:
- **All 22 tables** with complete schemas (field names, types, constraints)
- **SQL CREATE statements** for each table
- **Relationships & foreign keys** between tables
- **Basic CRUD examples** (CREATE, READ, UPDATE, DELETE)
- **Advanced queries** (joins, aggregations, searching, pagination)
- **Realtime subscriptions** setup and examples
- **File storage** operations (product images, avatars, receipts, certificates)
- **Row Level Security (RLS)** policies by role (Admin, Manager, Employee, Customer, Supplier)
- **Best practices** for performance and security

**Use This When**: You need to understand your database structure or write custom queries

---

### 🎮 **Interactive Playground** - Test All Operations Live
Run `npm run dev` in this folder and visit the playground page to:
- **Test all CRUD operations** without writing code
- **See input requirements** for each operation
- **View expected output** formats
- **Execute real queries** against your database
- **Get immediate feedback** with results or errors

**Available on**: `http://localhost:3002` when running dev server

---

### 📖 **PLAYGROUND.md** - Playground User Guide
Quick start guide explaining:
- How to use the playground interface
- What each category and operation does
- Input types and examples
- Tips for testing and troubleshooting
- Link to full schema documentation

**Use This When**: First time using the playground or need quick reference

---

### 🔌 **API_EXAMPLES.md** - Real Data Examples
Complete examples showing:
- **What to send** for each operation (request body)
- **What you get back** (response format)
- **Real JSON examples** for all data types
- **All 8 categories** with multiple operations each
- **Error formats** and common error codes
- **Response structure** for GET, POST, PUT, DELETE

**Use This When**: Building your frontend and need to know exact data formats

---

## 🏗️ Technical Files

### `lib/supabaseClient.ts`
Initializes the Supabase client with your credentials:
```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);
export { supabase };
```

### `lib/supabaseExamples.ts`
Contains all operation definitions with:
- Operation descriptions
- Query code
- Input field requirements
- Expected return formats
- Executable functions for testing

### `app/page.tsx`
Interactive React component that:
- Displays all operations in a user-friendly UI
- Handles form inputs and execution
- Shows real results from your database
- Provides visual feedback (loading, errors, success)

---

## 📊 Quick Reference: All Operations

### **Products** (3 operations)
- SELECT all products
- INSERT new product
- UPDATE product status

### **Batches** (2 operations)
- SELECT all batches
- INSERT new batch (lô hàng)

### **Orders** (3 operations)
- SELECT user orders
- INSERT new order
- UPDATE order status

### **Inventory** (3 operations)
- SELECT low stock
- INSERT incoming stock (nhập hàng)
- INSERT stock removal (xuất hàng)

### **Cart** (2 operations)
- SELECT user cart
- INSERT item to cart

### **Reviews** (2 operations)
- SELECT product reviews
- INSERT new review

### **Group Buys** (2 operations)
- SELECT open campaigns
- INSERT member join

### **Search & Filter** (2 operations)
- SEARCH products by name
- SEARCH orders by date range

**Total: 20 Operations** covering all CRUD functionality

---

## 🚀 How to Get Started

### Step 1: Start the Playground
```bash
cd supabase-playground
npm run dev
```

### Step 2: Open Browser
Navigate to `http://localhost:3002`

### Step 3: Test Operations
1. Click a category on the left (e.g., "Products")
2. Select an operation (e.g., "selectAll")
3. Fill in any required inputs (marked with *)
4. Click "▶ Execute Operation"
5. View the results below

### Step 4: Build With Data
Use the example formats from **API_EXAMPLES.md** to build your app

---

## 📋 Input Reference

### Data Types & Examples

| Type | Example | Format | Notes |
|------|---------|--------|-------|
| UUID | `550e8400-e29b-41d4-a716-446655440000` | String | Copy from existing records |
| VARCHAR | `"Organic Tomatoes"` | String | Text field |
| INTEGER | `500` | Number | Whole numbers only |
| NUMERIC | `150000.00` | Number | Decimal allowed |
| DATE | `2026-03-19` | String | YYYY-MM-DD |
| TIMESTAMP | `2026-03-19T10:30:00Z` | String | ISO 8601 format (usually auto-generated) |
| TEXT | `"Long description..."` | String | Large text field |
| BOOLEAN | `true` or `false` | Boolean | True/false |

### Required vs Optional
- Fields marked with **\*** are required
- You must provide values for all required fields
- Optional fields can be left empty (null)

---

## 📤 Response Format

All responses follow this structure:
```json
{
  "data": [...] or {...},
  "error": null or {...}
}
```

### Success Response (SELECT)
```json
{
  "data": [
    { "id": "...", "name": "...", ...},
    { "id": "...", "name": "...", ...}
  ],
  "error": null
}
```

### Success Response (INSERT/UPDATE)
```json
{
  "data": { "id": "...", "name": "...", ...},
  "error": null
}
```

### Error Response
```json
{
  "data": null,
  "error": {
    "message": "Field 'name' is required",
    "code": "INVALID_REQUEST",
    "status": 400
  }
}
```

---

## 💡 Pro Tips

### 🔍 Finding UUIDs
You can't create UUIDs yourself - Supabase generates them. To get real UUIDs:
1. Run `Products > selectAll` in the playground
2. Copy a `product_id` from the results
3. Use it in other operations

### ➝ Operation Flow
Typical flow when building features:
1. **SELECT** first to verify data exists
2. **INSERT** to add new data
3. **UPDATE** to modify existing
4. **DELETE** to remove (if needed)

### 🧪 Best Practice
- Always test with the playground first
- Read the expected return format before querying
- Check error messages - they tell you exactly what's wrong
- Review API_EXAMPLES.md for exact JSON structures

### 🐛 Debugging
If you get an error:
1. Check the error message (very specific)
2. Verify all required fields (*) are filled
3. Check data types match (string vs number)
4. Verify IDs/UUIDs actually exist in database
5. See API_EXAMPLES.md for error codes

---

## 🔐 Authentication & Security

Your Supabase project uses:
- **Public API Key**: In env variables (safe to expose)
- **Row Level Security**: Not yet implemented (see SUPABASE.md)
- **Auth Methods**: Ready to configure (Email/OAuth)

**Important**: Before going to production:
1. Implement RLS policies (see SUPABASE.md)
2. Enable auth providers you'll use
3. Test permission boundaries
4. Review security best practices

---

## 📖 Learning Path

**New to Supabase?**
1. Start with PLAYGROUND.md for interface overview
2. Read SUPABASE.md section "Database Schema" 
3. Test operations in the playground
4. Check API_EXAMPLES.md for real data formats
5. Read "Best Practices" in SUPABASE.md

**Building a Feature?**
1. Read the table schema in SUPABASE.md
2. Find similar operations in API_EXAMPLES.md
3. Test it in the playground
4. Copy the query code to your component
5. Handle errors based on error codes

**Performance Questions?**
1. See "Advanced Queries" in SUPABASE.md
2. Check indexes recommended in SUPABASE.md
3. Review "Best Practices" section
4. Test with playground to verify results

---

## 🗂️ File Structure

```
supabase-playground/
├── app/
│   ├── page.tsx              # Interactive playground UI
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── supabaseClient.ts     # Client initialization
│   └── supabaseExamples.ts   # All operations & examples
├── SUPABASE.md              # 📖 Complete database reference
├── PLAYGROUND.md            # 🎮 Playground guide
├── API_EXAMPLES.md          # 🔌 Real data examples
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🎯 Next Steps

- [x] View complete database schema → Open **SUPABASE.md**
- [x] Use interactive playground → Run `npm run dev` on port 3002
- [x] See operation examples → Open **API_EXAMPLES.md**
- [ ] Enable authentication (if needed)
- [ ] Implement RLS policies (before production)
- [ ] Add to web-client/web-admin apps
- [ ] Set up database indexes
- [ ] Configure backup strategy

---

**Version**: 1.0 | **Last Updated**: March 19, 2026
