This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# 🧪 Supabase Playground - GreenPlus

Interactive testing environment for all Supabase database operations.

Test real queries, see documentation, understand data formats—all in one place.

---

## 🚀 Quick Start

### Run the Playground
```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

### Try Your First Operation
1. Select **"Products"** from the left sidebar
2. Click **"selectAll"** 
3. Click **"▶ Execute Operation"**
4. See results from your database!

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-----------|
| [**README_DOCS.md**](README_DOCS.md) | 📖 Overview of all docs & learning path | Start here to understand the structure |
| [**SUPABASE.md**](SUPABASE.md) | 📋 Complete database schema reference | Understanding tables, fields, relationships |
| [**PLAYGROUND.md**](PLAYGROUND.md) | 🎮 Playground interface guide | Learning how to use the interactive tool |
| [**API_EXAMPLES.md**](API_EXAMPLES.md) | 🔌 Real JSON examples for all operations | Building frontend, exact data formats |

---

## 🎯 What Can You Do Here?

### ✅ **Test Operations**
- **20+ operations** across 8 categories
- **SELECT queries** to fetch data
- **INSERT operations** to create records
- **UPDATE operations** to modify data
- **Real-time results** from your Supabase database

### 📊 **View Data Structures**
- See what each operation returns
- Understand required input fields
- View data relationships
- Learn field types and constraints

### 💡 **Learn by Example**
- Copy query code to your app
- Use example data structures
- Test before implementing
- Understand relationships between tables

### 🔍 **Explore Your Database**
- Browse all 22 tables
- See actual data instantly
- Test filters and searches
- Understand inventory tracking

---

## 📂 Operations Overview

### **8 Categories**, **20+ Operations**

#### 1️⃣ **Products** - Catalog Management
- Get all active products
- Add new product
- Update product details

#### 2️⃣ **Batches** - Lô Hàng (Stock Lots)
- View all batches
- Create new batch with harvest dates
- Track batch expiration

#### 3️⃣ **Orders** - Order Management
- Get customer orders
- Create new order
- Track order status

#### 4️⃣ **Inventory** - Tồn Kho (Stock)
- Check low stock alerts
- Record incoming stock (nhập)
- Record outgoing stock (xuất)

#### 5️⃣ **Cart** - Shopping Cart
- View user cart
- Add items to cart

#### 6️⃣ **Reviews** - Customer Reviews
- Get product reviews
- Add new review

#### 7️⃣ **Group Buys** - Mua Chung
- View open campaigns
- Join group buy

#### 8️⃣ **Search & Filter** - Data Search
- Search by name
- Filter by date range

---

## 📖 Learning Path

### 🟢 **Beginner**
1. Open playground (http://localhost:3002)
2. Try `Products > selectAll`
3. Read [PLAYGROUND.md](PLAYGROUND.md)
4. Try a few more SELECT operations

### 🟡 **Intermediate**
1. Read [SUPABASE.md](SUPABASE.md) - Database Schema section
2. Try INSERT operations (add data)
3. Try UPDATE operations (modify data)
4. Read [API_EXAMPLES.md](API_EXAMPLES.md) for exact formats

### 🔴 **Advanced**
1. Read Advanced Queries section in [SUPABASE.md](SUPABASE.md)
2. Copy query code to your components
3. Implement RLS policies (see SUPABASE.md)
4. Set up Realtime subscriptions

---

## 📋 Example Operations

### GET - Fetch Products
```
Category: Products
Operation: selectAll
Input: None needed
Output: Array of all active products with categories and suppliers
```

### POST - Add to Cart
```
Category: Cart
Operation: addToCart
Input: cart_id (UUID), product_id (UUID), quantity (number)
Output: New cart item object with timestamp
```

### GET - User Orders
```
Category: Orders
Operation: selectUserOrders
Input: user_id (UUID)
Output: All orders with items, payments, and delivery info
```

---

## 💡 Tips & Tricks

### 🔍 **Finding Real UUIDs**
- Run any SELECT operation first
- Copy actual UUID values from results
- Use them in INSERT/UPDATE operations

### 📝 **Testing Workflow**
1. **SELECT first** - Verify data exists
2. **INSERT** - Add new test data
3. **UPDATE** - Modify and verify
4. **DELETE** - Clean up (if needed)

### 🧪 **Common Tests**
- `Products > selectAll` - Is connection working?
- `Inventory > selectLow` - What's in stock?
- `Orders > selectUserOrders` - See a user's orders
- `Search & Filter > searchProducts` - Try search

---

## 🔐 Security & Setup

### What's Configured
✅ Supabase client initialized  
✅ Database connection working  
✅ All tables accessible  

### What's Not Yet Configured
❌ Authentication methods (Email, OAuth)  
❌ Row Level Security (RLS) policies  
❌ Storage buckets for files  

### Next Steps
1. Enable authentication in [SUPABASE.md](SUPABASE.md) Auth section
2. Implement RLS policies (before production)
3. Create storage buckets for images
4. Review security best practices

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.0
- **UI**: React 19 + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Client**: @supabase/supabase-js 2.x
- **Language**: TypeScript

---

## 📁 Project Structure

```
supabase-playground/
├── app/
│   ├── page.tsx              # 🎮 Interactive UI
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── supabaseClient.ts     # Client setup
│   └── supabaseExamples.ts   # All operations
├── SUPABASE.md              # 📖 Database reference
├── PLAYGROUND.md            # 🎮 UI guide
├── API_EXAMPLES.md          # 🔌 JSON examples
└── README_DOCS.md           # 📚 Full overview
```

---

## 📖 Documentation Quick Links

**Need to understand:**
- **Database structure?** → [SUPABASE.md](SUPABASE.md)
- **CRUD operations?** → [API_EXAMPLES.md](API_EXAMPLES.md)
- **How to use playground?** → [PLAYGROUND.md](PLAYGROUND.md)
- **Everything overview?** → [README_DOCS.md](README_DOCS.md)

---

## 🎓 Learning Supabase

### Free Resources
- [Supabase Official Docs](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase JS Client](https://github.com/supabase/supabase-js)

### Your Project Docs
1. [Complete Schema Reference](SUPABASE.md)
2. [Real Operation Examples](API_EXAMPLES.md)
3. [Interactive Testing](http://localhost:3002)

---

## 🚀 Next Steps

- [ ] Run `npm run dev` and explore playground
- [ ] Read [SUPABASE.md](SUPABASE.md) - Database Schema
- [ ] Try all 8 categories of operations
- [ ] Set up authentication
- [ ] Implement RLS policies
- [ ] Connect to web-client/web-admin
- [ ] Add Realtime subscriptions
- [ ] Configure backups

---

## ❓ Troubleshooting

### Connection Issues?
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify they match your Supabase project
- Try `Products > selectAll` to test

### Operation Fails?
- Read the error message - it's specific
- Check all required fields (* marked) are filled
- Verify UUIDs/IDs actually exist
- See error codes in [API_EXAMPLES.md](API_EXAMPLES.md)

### Want Custom Queries?
- See Advanced Queries in [SUPABASE.md](SUPABASE.md)
- Check examples in `lib/supabaseExamples.ts`
- Copy and modify for your needs

---

**Version**: 1.0  
**Last Updated**: March 19, 2026  
**Project**: GreenPlus (Smart E-Grocery Platform)
