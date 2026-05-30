# Supabase Documentation - GreenPlus

Complete guide to Supabase operations for the GreenPlus smart e-grocery platform.

**Project URL**: `https://ujgnuwlljslwokblmrwi.supabase.co`

**Run-ready SQL schema**: `sql/greenplus_schema.sql`

Use this in Supabase Dashboard -> SQL Editor to create the full schema with constraints and indexes.

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [Authentication Setup](#authentication-setup)
3. [Basic CRUD Operations](#basic-crud-operations)
4. [Advanced Queries](#advanced-queries)
5. [Realtime Subscriptions](#realtime-subscriptions)
6. [File Storage](#file-storage)
7. [Row Level Security (RLS)](#row-level-security-rls)
8. [Best Practices](#best-practices)

---

## Database Schema

### 22 Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| **ROLES** | User role definitions | 1→n USERS |
| **USERS** | User profiles & auth | n→1 ROLES, 1→n ORDERS, REVIEWS, POSTS, etc. |
| **SUPPLIERS** | Farm/supplier management | 1→n PRODUCTS, BATCHES |
| **CATEGORIES** | Product categories | 1→n PRODUCTS |
| **PRODUCTS** | Product catalog | n→1 SUPPLIERS, CATEGORIES; 1→n BATCHES, REVIEWS |
| **BATCHES** | Product lots/batches | n→1 PRODUCTS, SUPPLIERS; 1→n INVENTORY, PRICES |
| **INVENTORY** | Stock per batch | n→1 BATCHES |
| **INVENTORY_TRANSACTIONS** | Stock in/out history | n→1 BATCHES |
| **PRICES** | Price history by batch/date | n→1 PRODUCTS, BATCHES |
| **CARTS** | User shopping carts | n→1 USERS; 1→n CART_ITEMS |
| **CART_ITEMS** | Items in cart | n→1 CARTS, PRODUCTS |
| **ORDERS** | Customer orders | n→1 USERS; 1→n ORDER_ITEMS |
| **ORDER_ITEMS** | Order line items | n→1 ORDERS, PRODUCTS, BATCHES |
| **PAYMENTS** | Payment records | n→1 ORDERS |
| **DELIVERIES** | Delivery assignments | n→1 ORDERS, USERS (employee) |
| **REVIEWS** | Product reviews | n→1 USERS, PRODUCTS |
| **COMPLAINTS** | Customer complaints/returns | n→1 USERS, ORDERS |
| **SUBSCRIPTIONS** | Recurring purchases | n→1 USERS, PRODUCTS |
| **POSTS** | Blog/community content | n→1 USERS |
| **GROUP_BUYS** | Group purchase campaigns | n→1 PRODUCTS, USERS (leader); 1→n GROUP_BUY_MEMBERS |
| **GROUP_BUY_MEMBERS** | Group buy participants | n→1 GROUP_BUYS, USERS |

---

## Detailed Table Schemas

### 1. ROLES
Store user role definitions (Admin, Manager, Employee, Customer)

```sql
CREATE TABLE ROLES (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(30) NOT NULL UNIQUE,
  description TEXT
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **role_id** | UUID | PK, auto-generated |
| **role_name** | VARCHAR(30) | NOT NULL, UNIQUE |
| **description** | TEXT | NULL |

### 2. USERS
User profiles and authentication

```sql
CREATE TABLE USERS (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES ROLES(role_id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **user_id** | UUID | PK, auto-generated |
| **role_id** | UUID | FK → ROLES.role_id |
| **name** | VARCHAR(100) | NOT NULL |
| **email** | VARCHAR(255) | NOT NULL, UNIQUE |
| **password** | VARCHAR(255) | NOT NULL |
| **phone** | VARCHAR(20) | NULL |
| **address** | VARCHAR(255) | NULL |
| **status** | VARCHAR(20) | DEFAULT 'active' (active, inactive, banned) |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 3. SUPPLIERS
Farm/supplier information

```sql
CREATE TABLE SUPPLIERS (
  supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  certificate VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **supplier_id** | UUID | PK |
| **name** | VARCHAR(150) | NOT NULL |
| **address** | VARCHAR(255) | NOT NULL |
| **certificate** | VARCHAR(255) | Certificate URL, NULL |
| **status** | VARCHAR(20) | DEFAULT 'pending' (pending, approved, rejected) |
| **description** | TEXT | NULL |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 4. CATEGORIES
Product categories

```sql
CREATE TABLE CATEGORIES (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **category_id** | UUID | PK |
| **name** | VARCHAR(100) | NOT NULL |
| **description** | TEXT | NULL |

### 5. PRODUCTS
Product catalog

```sql
CREATE TABLE PRODUCTS (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES CATEGORIES(category_id),
  supplier_id UUID NOT NULL REFERENCES SUPPLIERS(supplier_id),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  unit VARCHAR(20) NOT NULL,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **product_id** | UUID | PK |
| **category_id** | UUID | FK → CATEGORIES.category_id |
| **supplier_id** | UUID | FK → SUPPLIERS.supplier_id |
| **name** | VARCHAR(150) | NOT NULL |
| **description** | TEXT | NULL |
| **unit** | VARCHAR(20) | NOT NULL (kg, gram, pack, piece) |
| **image_url** | TEXT | Product image URL |
| **status** | VARCHAR(20) | DEFAULT 'active' (active, inactive) |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 6. BATCHES
Product batches/lots (harvest date, expiry, QR code)

```sql
CREATE TABLE BATCHES (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES PRODUCTS(product_id),
  supplier_id UUID NOT NULL REFERENCES SUPPLIERS(supplier_id),
  harvest_date DATE NOT NULL,
  expire_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  qr_code VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'expired', 'sold_out'))
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **batch_id** | UUID | PK |
| **product_id** | UUID | FK → PRODUCTS.product_id |
| **supplier_id** | UUID | FK → SUPPLIERS.supplier_id |
| **harvest_date** | DATE | NOT NULL |
| **expire_date** | DATE | NOT NULL |
| **quantity** | INTEGER | NOT NULL |
| **qr_code** | VARCHAR(255) | UNIQUE, for traceability |
| **status** | VARCHAR(20) | DEFAULT 'available' (available, expired, sold_out) |

### 7. INVENTORY
Stock management per batch

```sql
CREATE TABLE INVENTORY (
  inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES BATCHES(batch_id),
  quantity_available INTEGER NOT NULL,
  quantity_reserved INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **inventory_id** | UUID | PK |
| **batch_id** | UUID | FK → BATCHES.batch_id |
| **quantity_available** | INTEGER | NOT NULL |
| **quantity_reserved** | INTEGER | DEFAULT 0 |
| **last_updated** | TIMESTAMP | DEFAULT now() |

### 8. INVENTORY_TRANSACTIONS
Stock in/out/adjustment history

```sql
CREATE TABLE INVENTORY_TRANSACTIONS (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES BATCHES(batch_id),
  type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **transaction_id** | UUID | PK |
| **batch_id** | UUID | FK → BATCHES.batch_id |
| **type** | VARCHAR(20) | NOT NULL (in, out, adjustment) |
| **quantity** | INTEGER | NOT NULL |
| **note** | VARCHAR(255) | NULL |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 9. PRICES
Price history by product/batch and date

```sql
CREATE TABLE PRICES (
  price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES PRODUCTS(product_id),
  batch_id UUID REFERENCES BATCHES(batch_id),
  price NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **price_id** | UUID | PK |
| **product_id** | UUID | FK → PRODUCTS.product_id |
| **batch_id** | UUID | FK → BATCHES.batch_id (NULL for general pricing) |
| **price** | NUMERIC(10,2) | NOT NULL (supports up to 99,999,999.99) |
| **date** | DATE | NOT NULL |

### 10. CARTS
User shopping carts

```sql
CREATE TABLE CARTS (
  cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES USERS(user_id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **cart_id** | UUID | PK |
| **user_id** | UUID | FK → USERS.user_id |
| **created_at** | TIMESTAMP | DEFAULT now() |
| **updated_at** | TIMESTAMP | NULL |

### 11. CART_ITEMS
Items in shopping cart

```sql
CREATE TABLE CART_ITEMS (
  cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES CARTS(cart_id),
  product_id UUID NOT NULL REFERENCES PRODUCTS(product_id),
  quantity INTEGER NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **cart_item_id** | UUID | PK |
| **cart_id** | UUID | FK → CARTS.cart_id |
| **product_id** | UUID | FK → PRODUCTS.product_id |
| **quantity** | INTEGER | NOT NULL |
| **note** | VARCHAR(255) | NULL |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 12. ORDERS
Customer orders

```sql
CREATE TABLE ORDERS (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES USERS(user_id),
  order_date TIMESTAMP DEFAULT now(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL,
  delivery_address VARCHAR(255) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **order_id** | UUID | PK |
| **user_id** | UUID | FK → USERS.user_id |
| **order_date** | TIMESTAMP | DEFAULT now() |
| **status** | VARCHAR(20) | DEFAULT 'pending' (pending, confirmed, preparing, delivering, completed, cancelled) |
| **total_amount** | NUMERIC(10,2) | NOT NULL |
| **delivery_address** | VARCHAR(255) | NOT NULL |
| **delivery_fee** | NUMERIC(10,2) | DEFAULT 0 |
| **note** | TEXT | NULL |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 13. ORDER_ITEMS
Line items in each order

```sql
CREATE TABLE ORDER_ITEMS (
  order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ORDERS(order_id),
  product_id UUID NOT NULL REFERENCES PRODUCTS(product_id),
  batch_id UUID NOT NULL REFERENCES BATCHES(batch_id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **order_item_id** | UUID | PK |
| **order_id** | UUID | FK → ORDERS.order_id |
| **product_id** | UUID | FK → PRODUCTS.product_id |
| **batch_id** | UUID | FK → BATCHES.batch_id |
| **quantity** | INTEGER | NOT NULL |
| **price** | NUMERIC(10,2) | Price at time of order |

### 15. PAYMENTS
Payment information and status

```sql
CREATE TABLE PAYMENTS (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ORDERS(order_id),
  method VARCHAR(30) NOT NULL CHECK (method IN ('cod', 'momo', 'vnpay', 'bank_transfer')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  amount NUMERIC(10,2) NOT NULL,
  transaction_id VARCHAR(255),
  payment_date TIMESTAMP
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **payment_id** | UUID | PK |
| **order_id** | UUID | FK → ORDERS.order_id |
| **method** | VARCHAR(30) | NOT NULL (cod, momo, vnpay, bank_transfer) |
| **status** | VARCHAR(20) | DEFAULT 'pending' (pending, paid, failed) |
| **amount** | NUMERIC(10,2) | NOT NULL |
| **transaction_id** | VARCHAR(255) | External transaction ref |
| **payment_date** | TIMESTAMP | NULL |

### 16. DELIVERIES
Delivery management and assignments

```sql
CREATE TABLE DELIVERIES (
  delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ORDERS(order_id),
  employee_id UUID NOT NULL REFERENCES USERS(user_id),
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'delivering', 'delivered')),
  pickup_time TIMESTAMP,
  delivery_time TIMESTAMP,
  note TEXT
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **delivery_id** | UUID | PK |
| **order_id** | UUID | FK → ORDERS.order_id |
| **employee_id** | UUID | FK → USERS.user_id (delivery partner) |
| **status** | VARCHAR(20) | DEFAULT 'assigned' (assigned, picked_up, delivering, delivered) |
| **pickup_time** | TIMESTAMP | NULL |
| **delivery_time** | TIMESTAMP | NULL |
| **note** | TEXT | NULL |

### 17. REVIEWS
Product reviews by customers

```sql
CREATE TABLE REVIEWS (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES USERS(user_id),
  product_id UUID NOT NULL REFERENCES PRODUCTS(product_id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **review_id** | UUID | PK |
| **user_id** | UUID | FK → USERS.user_id |
| **product_id** | UUID | FK → PRODUCTS.product_id |
| **rating** | INTEGER | NOT NULL, CHECK 1-5 |
| **comment** | TEXT | NULL |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 18. COMPLAINTS
Customer complaints and returns

```sql
CREATE TABLE COMPLAINTS (
  complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES USERS(user_id),
  order_id UUID NOT NULL REFERENCES ORDERS(order_id),
  type VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP,
  reject_reason TEXT
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **complaint_id** | UUID | PK |
| **user_id** | UUID | FK → USERS.user_id |
| **order_id** | UUID | FK → ORDERS.order_id |
| **type** | VARCHAR(30) | NOT NULL (quality, damaged, missing, etc.) |
| **description** | TEXT | NOT NULL |
| **status** | VARCHAR(20) | DEFAULT 'pending' (pending, resolved, rejected) |
| **created_at** | TIMESTAMP | DEFAULT now() |
| **resolved_at** | TIMESTAMP | NULL |
| **reject_reason** | TEXT | NULL |

### 19. SUBSCRIPTIONS
Recurring subscription purchases

```sql
CREATE TABLE SUBSCRIPTIONS (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES USERS(user_id),
  product_id UUID NOT NULL REFERENCES PRODUCTS(product_id),
  schedule VARCHAR(50) NOT NULL CHECK (schedule IN ('weekly', 'biweekly', 'monthly')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **subscription_id** | UUID | PK |
| **user_id** | UUID | FK → USERS.user_id |
| **product_id** | UUID | FK → PRODUCTS.product_id |
| **schedule** | VARCHAR(50) | NOT NULL (weekly, biweekly, monthly) |
| **status** | VARCHAR(20) | DEFAULT 'active' (active, paused, cancelled) |
| **start_date** | DATE | NOT NULL |
| **end_date** | DATE | NULL |

### 20. POSTS
Blog/community content

```sql
CREATE TABLE POSTS (
  post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES USERS(user_id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('blog', 'video', 'community')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **post_id** | UUID | PK |
| **user_id** | UUID | FK → USERS.user_id |
| **title** | VARCHAR(200) | NOT NULL |
| **content** | TEXT | NOT NULL |
| **type** | VARCHAR(20) | NOT NULL (blog, video, community) |
| **status** | VARCHAR(20) | DEFAULT 'pending' (pending, approved, rejected) |
| **created_at** | TIMESTAMP | DEFAULT now() |

### 21. GROUP_BUYS
Group purchase campaigns

```sql
CREATE TABLE GROUP_BUYS (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES PRODUCTS(product_id),
  leader_id UUID NOT NULL REFERENCES USERS(user_id),
  target_quantity INTEGER NOT NULL,
  current_quantity INTEGER DEFAULT 0,
  min_quantity INTEGER NOT NULL,
  discount_price NUMERIC(10,2),
  deadline TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'success', 'failed', 'closed'))
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **group_id** | UUID | PK |
| **product_id** | UUID | FK → PRODUCTS.product_id |
| **leader_id** | UUID | FK → USERS.user_id |
| **target_quantity** | INTEGER | NOT NULL |
| **current_quantity** | INTEGER | DEFAULT 0 |
| **min_quantity** | INTEGER | NOT NULL (minimum to activate) |
| **discount_price** | NUMERIC(10,2) | Special price if target met |
| **deadline** | TIMESTAMP | NOT NULL |
| **status** | VARCHAR(20) | DEFAULT 'open' (open, success, failed, closed) |

### 22. GROUP_BUY_MEMBERS
Participants in group purchases

```sql
CREATE TABLE GROUP_BUY_MEMBERS (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES GROUP_BUYS(group_id),
  user_id UUID NOT NULL REFERENCES USERS(user_id),
  quantity INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT now()
);
```

| Field | Type | Constraint |
|-------|------|-----------|
| **id** | UUID | PK |
| **group_id** | UUID | FK → GROUP_BUYS.group_id |
| **user_id** | UUID | FK → USERS.user_id |
| **quantity** | INTEGER | NOT NULL |
| **joined_at** | TIMESTAMP | DEFAULT now() |

---

## Authentication Setup

### Setup Steps (Required)

1. **Enable Email Authentication** in Supabase Dashboard:
   - Go to Authentication → Providers → Email
   - Enable "Email" provider

2. **Setup OAuth (Recommended)**:
   - Google OAuth: Create OAuth credentials in Google Cloud Console
   - Add redirect URL: `http://localhost:3000/auth/callback`

3. **Configure JWT Secret** (already done by Supabase)

### Basic Auth Example

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sign up
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

// Sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// OAuth with Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });
  return { data, error };
}
```

---

## Basic CRUD Operations

### CREATE (INSERT)

#### Add Product to Catalog
```typescript
const { data, error } = await supabase
  .from("PRODUCTS")
  .insert([
    {
      category_id: categoryUUID,
      supplier_id: supplierUUID,
      name: "Organic Tomatoes",
      description: "Fresh locally grown tomatoes",
      unit: "kg",
      image_url: "https://example.com/tomato.jpg",
      status: "active",
    },
  ])
  .select();

if (error) throw error;
console.log("Product created:", data);
```

#### Create Batch (Lô hàng)
```typescript
const { data, error } = await supabase
  .from("BATCHES")
  .insert([
    {
      product_id: productUUID,
      supplier_id: supplierUUID,
      harvest_date: "2026-03-15",
      expire_date: "2026-04-15",
      quantity: 500,
      qr_code: "BATCH-2026-03-001",
      status: "available",
    },
  ])
  .select();
```

#### Create Order
```typescript
const { data, error } = await supabase
  .from("ORDERS")
  .insert([
    {
      user_id: userUUID,
      status: "pending",
      total_amount: 50000, // in cents (VND)
      delivery_address: "123 Main St, Ho Chi Minh",
      delivery_fee: 5000,
      note: "Please ring doorbell twice",
    },
  ])
  .select();
```

#### Add Item to Cart
```typescript
const { data, error } = await supabase
  .from("CART_ITEMS")
  .insert([
    {
      cart_id: cartUUID,
      product_id: productUUID,
      quantity: 2,
      note: "Pick the fresher batch if available",
    },
  ])
  .select();
```

#### Record Stock Transaction
```typescript
const { data, error } = await supabase
  .from("INVENTORY_TRANSACTIONS")
  .insert([
    {
      batch_id: batchUUID,
      type: "in", // in, out, adjustment
      quantity: 500,
      note: "Received from supplier",
    },
  ])
  .select();
```

### READ (SELECT)

#### Get All Active Products
```typescript
const { data, error } = await supabase
  .from("PRODUCTS")
  .select(`
    *,
    CATEGORIES(name),
    SUPPLIERS(name)
  `)
  .eq("status", "active")
  .order("name", { ascending: true });
```

#### Get Products by Category
```typescript
const { data, error } = await supabase
  .from("PRODUCTS")
  .select("*")
  .eq("category_id", categoryUUID);
```

#### Get User Orders with Complete Details
```typescript
const { data, error } = await supabase
  .from("ORDERS")
  .select(`
    *,
    ORDER_ITEMS(
      quantity,
      price,
      PRODUCTS(name, unit),
      BATCHES(harvest_date, expire_date)
    ),
    PAYMENTS(status, amount, method),
    DELIVERIES(status, pickup_time, delivery_time)
  `)
  .eq("user_id", userUUID)
  .order("created_at", { ascending: false });
```

#### Get Current Inventory for Batch
```typescript
const { data, error } = await supabase
  .from("INVENTORY")
  .select(`
    *,
    BATCHES(
      product_id,
      harvest_date,
      expire_date,
      PRODUCTS(name, unit)
    )
  `)
  .gt("quantity_available", 0);
```

#### Get Approved Suppliers
```typescript
const { data, error } = await supabase
  .from("SUPPLIERS")
  .select("*")
  .eq("status", "approved")
  .order("name", { ascending: true });
```

#### Get Available Batches for Product
```typescript
const { data, error } = await supabase
  .from("BATCHES")
  .select("*")
  .eq("product_id", productUUID)
  .eq("status", "available")
  .gt("quantity", 0)
  .order("harvest_date", { ascending: false });
```

#### Search Products by Name
```typescript
const { data, error } = await supabase
  .from("PRODUCTS")
  .select("*")
  .ilike("name", "%tomato%");
```

### UPDATE

#### Update Product Status
```typescript
const { data, error } = await supabase
  .from("PRODUCTS")
  .update({ status: "inactive" })
  .eq("product_id", productUUID)
  .select();
```

#### Set Batch as Expired
```typescript
const { data, error } = await supabase
  .from("BATCHES")
  .update({ status: "expired" })
  .eq("batch_id", batchUUID)
  .select();
```

#### Update Order Status
```typescript
const { data, error } = await supabase
  .from("ORDERS")
  .update({ 
    status: "completed",
  })
  .eq("order_id", orderUUID)
  .select();
```

#### Update Inventory Available Quantity
```typescript
const { data, error } = await supabase
  .from("INVENTORY")
  .update({ 
    quantity_available: availableQty,
    last_updated: new Date().toISOString(),
  })
  .eq("batch_id", batchUUID)
  .select();
```

#### Update Cart Item Quantity
```typescript
const { data, error } = await supabase
  .from("CART_ITEMS")
  .update({ quantity: newQuantity })
  .eq("cart_item_id", cartItemUUID)
  .select();
```

### DELETE

#### Remove Item from Cart
```typescript
const { error } = await supabase
  .from("CART_ITEMS")
  .delete()
  .eq("cart_item_id", cartItemUUID);

if (error) throw error;
console.log("Item removed from cart");
```

#### Cancel Order (only if pending)
```typescript
const { error } = await supabase
  .from("ORDERS")
  .delete()
  .eq("order_id", orderUUID)
  .eq("status", "pending");
```

---

## Advanced Queries

### Aggregation: Total Sales by Supplier
```typescript
const { data, error } = await supabase
  .from("ORDER_ITEMS")
  .select(`
    quantity,
    price,
    ORDERS(created_at),
    PRODUCTS(supplier_id)
  `)
  .order("created_at", { ascending: false });

// Client-side aggregation by supplier
const salesBySupplier = data?.reduce((acc, item) => {
  const supplierId = item.PRODUCTS.supplier_id;
  const total = item.quantity * item.price;
  acc[supplierId] = (acc[supplierId] || 0) + total;
  return acc;
}, {} as Record<string, number>);
```

### Batch Analytics: Best Selling Batches
```typescript
const { data, error } = await supabase
  .from("ORDER_ITEMS")
  .select(`
    batch_id,
    quantity,
    BATCHES(
      product_id,
      harvest_date,
      supplier_id,
      PRODUCTS(name, unit)
    )
  `)
  .order("created_at", { ascending: false });

// Group by batch
const batchSales = data?.reduce((acc, item) => {
  const batchId = item.batch_id;
  acc[batchId] = (acc[batchId] || 0) + item.quantity;
  return acc;
}, {} as Record<string, number>);
```

### Join Multiple Tables: Complete Order View
```typescript
const { data, error } = await supabase
  .from("ORDERS")
  .select(`
    *,
    USERS(email, phone, name),
    ORDER_ITEMS(
      quantity,
      price,
      PRODUCTS(name, unit),
      BATCHES(harvest_date, expire_date, SUPPLIERS(name))
    ),
    DELIVERIES(status, pickup_time, delivery_time),
    PAYMENTS(status, amount, method),
  `)
  .eq("order_id", orderUUID);
```

### Stock Alert: Low Inventory
```typescript
const { data, error } = await supabase
  .from("INVENTORY")
  .select(`
    *,
    BATCHES(
      product_id,
      expire_date,
      PRODUCTS(name, unit)
    )
  `)
  .lt("quantity_available", 50); // Alert if less than 50 units

// Filter for non-expired batches
const activeAlerts = data?.filter(
  item => new Date(item.BATCHES.expire_date) > new Date()
);
```

### Search & Filter Products
```typescript
// Search by name and available
const { data, error } = await supabase
  .from("PRODUCTS")
  .select(`
    *,
    CATEGORIES(name),
    SUPPLIERS(name)
  `)
  .eq("status", "active")
  .ilike("name", "%green%")
  .order("name");
```

### Date Range Query: Orders in Period
```typescript
const startDate = "2026-01-01";
const endDate = "2026-03-31";

const { data, error } = await supabase
  .from("ORDERS")
  .select("*")
  .gte("order_date", startDate)
  .lte("order_date", endDate)
  .order("order_date", { ascending: false });
```

### Pagination: Load Products (20 per page)
```typescript
const pageSize = 20;
const pageNumber = 1;

const { data, error } = await supabase
  .from("PRODUCTS")
  .select("*", { count: "exact" })
  .range((pageNumber - 1) * pageSize, pageNumber * pageSize - 1);

console.log(`Total products: ${error ? 0 : count}`);
```

### User Orders Summary
```typescript
const { data, error } = await supabase
  .from("ORDERS")
  .select(`
    order_id,
    order_date,
    status,
    total_amount,
    PAYMENTS(status),
    DELIVERIES(status)
  `)
  .eq("user_id", userUUID)
  .order("order_date", { ascending: false })
  .limit(50);
```

### Supplier Performance: Total Products & Orders
```typescript
const { data: products } = await supabase
  .from("PRODUCTS")
  .select("product_id")
  .eq("supplier_id", supplierUUID);

const { data: orders } = await supabase
  .from("ORDER_ITEMS")
  .select(`
    PRODUCTS(supplier_id)
  `)
  .eq("PRODUCTS.supplier_id", supplierUUID);

console.log(`Supplier has ${products?.length || 0} products`);
```

### Group Buy Status
```typescript
const { data, error } = await supabase
  .from("GROUP_BUYS")
  .select(`
    *,
    GROUP_BUY_MEMBERS(
      user_id,
      quantity,
      joined_at
    ),
    PRODUCTS(name, unit),
    USERS(name)
  `)
  .eq("status", "open")
  .order("deadline", { ascending: true });
```

---

## Realtime Subscriptions

### Subscribe to Order Status Changes
```typescript
supabase
  .channel("orders-updates")
  .on(
    "postgres_changes",
    {
      event: "*", // INSERT, UPDATE, DELETE
      schema: "public",
      table: "ORDERS",
      filter: `user_id=eq.${userUUID}`,
    },
    (payload) => {
      console.log("Order updated:", payload.new);
      if (payload.eventType === "UPDATE") {
        // Handle order status change
        setOrderStatus(payload.new.status);
      }
    }
  )
  .subscribe();
```

### Subscribe to Inventory Changes
```typescript
supabase
  .channel("inventory-updates")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "INVENTORY",
    },
    (payload) => {
      console.log("Stock updated for batch:", payload.new.batch_id);
      console.log("Available:", payload.new.quantity_available);
      // Update UI with new stock info
    }
  )
  .subscribe();
```

### Subscribe to Batch Expiration Alerts
```typescript
supabase
  .channel("batch-updates")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "BATCHES",
      filter: "status=eq.expired",
    },
    (payload) => {
      console.log("Batch expired:", payload.new.batch_id);
      // Alert supplier or admin
    }
  )
  .subscribe();
```

### Subscribe to Price Changes
```typescript
supabase
  .channel("price-updates")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "PRICES",
    },
    (payload) => {
      console.log("New price for product:", payload.new.product_id);
      console.log("Price:", payload.new.price);
    }
  )
  .subscribe();
```

### Subscribe to Payment Status
```typescript
supabase
  .channel("payment-updates")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "PAYMENTS",
      filter: `order_id=eq.${orderUUID}`,
    },
    (payload) => {
      if (payload.new.status === "paid") {
        console.log("Payment confirmed!");
        // Update UI
      }
    }
  )
  .subscribe();
```

### Subscribe to Delivery Status
```typescript
supabase
  .channel("delivery-updates")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "DELIVERIES",
      filter: `order_id=eq.${orderUUID}`,
    },
    (payload) => {
      console.log("Delivery status:", payload.new.status);
      console.log("Location:", payload.new.note);
    }
  )
  .subscribe();
```

### Cleanup Subscriptions
```typescript
// Unsubscribe when done
export function cleanupSubscription(channelName: string) {
  supabase.removeChannel(supabase.channel(channelName));
}

// Unsubscribe all
export function cleanupAllSubscriptions() {
  supabase.getChannels().forEach(channel => {
    supabase.removeChannel(channel);
  });
}
```

---

## File Storage

### Setup Storage Buckets

Create these buckets in Supabase Storage:
- `product-images` - Product photos
- `user-avatars` - Profile pictures
- `receipts` - Order receipts and invoices
- `certificates` - Organic/quality certificates

### Upload Product Image
```typescript
const { data, error } = await supabase.storage
  .from("product-images")
  .upload(`products/${productUUID}/${fileName}`, file, {
    cacheControl: "3600",
    upsert: false,
  });

if (error) throw error;

// Get public URL
const { data: urlData } = supabase.storage
  .from("product-images")
  .getPublicUrl(`products/${productUUID}/${fileName}`);

// Update PRODUCTS table with image URL
await supabase
  .from("PRODUCTS")
  .update({ image_url: urlData.publicUrl })
  .eq("product_id", productUUID);
```

### Upload User Avatar
```typescript
const { data, error } = await supabase.storage
  .from("user-avatars")
  .upload(`avatars/${userUUID}/${fileName}`, avatarFile, {
    upsert: true, // Replace if exists
  });

if (error) throw error;

// Get public URL
const { data: urlData } = supabase.storage
  .from("user-avatars")
  .getPublicUrl(`avatars/${userUUID}/${fileName}`);
```

### Upload Order Receipt
```typescript
const { data, error } = await supabase.storage
  .from("receipts")
  .upload(`orders/${orderUUID}/${fileName}`, receiptFile);

if (error) throw error;

const { data: urlData } = supabase.storage
  .from("receipts")
  .getPublicUrl(`orders/${orderUUID}/${fileName}`);
```

### Upload Supplier Certificate
```typescript
const { data, error } = await supabase.storage
  .from("certificates")
  .upload(`suppliers/${supplierUUID}/certification.pdf`, certFile);

if (error) throw error;

// Update SUPPLIERS table
const { data: urlData } = supabase.storage
  .from("certificates")
  .getPublicUrl(`suppliers/${supplierUUID}/certification.pdf`);

await supabase
  .from("SUPPLIERS")
  .update({ certificate: urlData.publicUrl })
  .eq("supplier_id", supplierUUID);
```

### Download/Retrieve File
```typescript
const { data, error } = await supabase.storage
  .from("product-images")
  .download(`products/${productUUID}/${fileName}`);

if (error) throw error;

// Create blob URL for display
const url = URL.createObjectURL(data);
const img = document.querySelector("img") as HTMLImageElement;
img.src = url;
```

### Delete File
```typescript
const { error } = await supabase.storage
  .from("product-images")
  .remove([`products/${productUUID}/${fileName}`]);

if (error) throw error;
console.log("File deleted");
```

---

## Row Level Security (RLS)

### Security Overview

RLS enables database-level access control. **Currently None Setup** - you should implement policies based on roles: Admin, Manager, Employee, Customer.

### Recommended RLS Architecture

```
ROLES:
- Admin: Full platform control (suppliers, products, inventory, users)
- Manager: Inventory & order management
- Employee/Delivery: View assigned orders/deliveries
- Customer: Own profile, orders, cart, reviews
```

### Recommended RLS Policies

#### Users Can Only View Their Own Profile
```sql
-- On USERS table
CREATE POLICY "Users can view own profile"
ON USERS FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON USERS FOR UPDATE
USING (auth.uid() = user_id);
```

#### Customers Can View & Create Orders Only for Themselves
```sql
-- On ORDERS table
CREATE POLICY "Customers can view own orders"
ON ORDERS FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Customers can create orders"
ON ORDERS FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all orders"
ON ORDERS FOR SELECT
USING (
  auth.jwt() ->> 'role' IN ('admin', 'manager')
);
```

#### Everyone Can View Available Products
```sql
-- On PRODUCTS table
CREATE POLICY "Anyone can view active products"
ON PRODUCTS FOR SELECT
USING (status = 'active');

CREATE POLICY "Suppliers can update own products"
ON PRODUCTS FOR UPDATE
USING (
  supplier_id IN (
    SELECT supplier_id FROM USERS WHERE user_id = auth.uid()
  )
);
```

#### Suppliers Can Only Manage Their Products & Batches
```sql
-- On BATCHES table
CREATE POLICY "Suppliers can view own batches"
ON BATCHES FOR SELECT
USING (
  supplier_id IN (
    SELECT supplier_id FROM USERS WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can update own batches"
ON BATCHES FOR UPDATE
USING (
  supplier_id IN (
    SELECT supplier_id FROM USERS WHERE user_id = auth.uid()
  )
);
```

#### Customers Can Only See Their Cart
```sql
-- On CARTS table
CREATE POLICY "Users can view own cart"
ON CARTS FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart"
ON CARTS FOR UPDATE, DELETE
USING (auth.uid() = user_id);

-- On CART_ITEMS table
CREATE POLICY "Users can manage own cart items"
ON CART_ITEMS FOR ALL
USING (cart_id IN (SELECT cart_id FROM CARTS WHERE user_id = auth.uid()));
```

#### Delivery Partners Can See Assigned Deliveries
```sql
-- On DELIVERIES table
CREATE POLICY "Employees can view assigned deliveries"
ON DELIVERIES FOR SELECT
USING (auth.uid() = employee_id);

CREATE POLICY "Employees can update own deliveries"
ON DELIVERIES FOR UPDATE
USING (auth.uid() = employee_id);
```

#### Only Customers Can Review Products
```sql
-- On REVIEWS table
CREATE POLICY "Users can view all reviews"
ON REVIEWS FOR SELECT
USING (true);

CREATE POLICY "Users can create own reviews"
ON REVIEWS FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON REVIEWS FOR UPDATE
USING (auth.uid() = user_id);
```

#### Admin and Manager Access
```sql
-- Allow admins to access everything
CREATE POLICY "Admins have access to all tables"
ON PRODUCTS FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can manage users"
ON USERS FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can manage suppliers"
ON SUPPLIERS FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

### Enable RLS on Tables

```sql
-- Enable RLS on specific tables
ALTER TABLE USERS ENABLE ROW LEVEL SECURITY;
ALTER TABLE ORDERS ENABLE ROW LEVEL SECURITY;
ALTER TABLE PRODUCTS ENABLE ROW LEVEL SECURITY;
ALTER TABLE BATCHES ENABLE ROW LEVEL SECURITY;
ALTER TABLE CARTS ENABLE ROW LEVEL SECURITY;
ALTER TABLE CART_ITEMS ENABLE ROW LEVEL SECURITY;
ALTER TABLE DELIVERIES ENABLE ROW LEVEL SECURITY;
ALTER TABLE REVIEWS ENABLE ROW LEVEL SECURITY;
ALTER TABLE SUPPLIERS ENABLE ROW LEVEL SECURITY;
ALTER TABLE PAYMENTS ENABLE ROW LEVEL SECURITY;
```

### Implementation Steps

1. **Go to Supabase Dashboard** → Authentication → Policies
2. **For each table**, click "Enable RLS"
3. **Add policies** using the SQL above or the Dashboard UI
4. **Test policies** with different user roles before going live
5. **Monitor performance** - RLS adds a small overhead

### Testing RLS Policies

```typescript
// Test with different auth tokens
const adminClient = supabase.auth.signInWithPassword({
  email: "admin@example.com",
  password: "admin_pass"
});

const customerClient = supabase.auth.signInWithPassword({
  email: "customer@example.com",
  password: "customer_pass"
});

// Query should return different results based on role
const { data } = await adminClient
  .from("ORDERS")
  .select("*"); // Admin sees all orders

const { data: customerOrders } = await customerClient
  .from("ORDERS")
  .select("*"); // Customer sees only own orders
```

---

## Best Practices

### 1. Connection Management
```typescript
// ✅ DO: Create client once and reuse
const supabase = createClient(url, key);

// ❌ DON'T: Create new client on every request
const client = createClient(url, key); // Every render
```

### 2. Error Handling
```typescript
try {
  const { data, error } = await supabase
    .from("PRODUCTS")
    .select("*");
  
  if (error) throw error;
  return data;
} catch (error) {
  console.error("Query failed:", error.message);
  // Show user-friendly error
}
```

### 3. Type Safety (TypeScript)
```typescript
// Define types for your tables
interface Product {
  id: number;
  name: string;
  base_price: number;
  is_available: boolean;
  created_at: string;
}

// Use in queries
const { data, error } = await supabase
  .from("PRODUCTS")
  .select("*") as { data: Product[] | null; error: any };
```

### 4. Batch Operations
```typescript
// Better for multiple inserts
const { data, error } = await supabase
  .from("CART_ITEMS")
  .insert(
    cartItems.map(item => ({
      cart_id: cartId,
      product_id: item.productId,
      quantity: item.quantity,
    }))
  );
```

### 5. Query Optimization
```typescript
// ✅ DO: Select only needed columns
const { data } = await supabase
  .from("PRODUCTS")
  .select("id, name, base_price");

// ❌ DON'T: Select everything
const { data } = await supabase
  .from("PRODUCTS")
  .select("*");
```

### 6. Use Indexes for Performance
```sql
-- Speed up common queries
CREATE INDEX idx_orders_user_id ON ORDERS(user_id);
CREATE INDEX idx_products_category ON PRODUCTS(category_id);
CREATE INDEX idx_inventory_location ON INVENTORY(location);
```

### 7. Rate Limiting
```typescript
// Implement debouncing for frequent queries
import { debounce } from "lodash";

const searchProducts = debounce(async (query: string) => {
  const { data } = await supabase
    .from("PRODUCTS")
    .select("*")
    .textSearch("name", query);
  setResults(data);
}, 500);
```

### 8. Caching
```typescript
// Cache results to reduce API calls
const productCache = new Map();

export async function getProduct(id: number) {
  if (productCache.has(id)) {
    return productCache.get(id);
  }
  
  const { data } = await supabase
    .from("PRODUCTS")
    .select("*")
    .eq("id", id);
  
  productCache.set(id, data[0]);
  return data[0];
}
```

---

## External Information You Need to Continue

To fully implement and optimize your Supabase setup:

### ✅ Already Configured
- **Project**: ujgnuwlljslwokblmrwi.supabase.co
- **Client connectivity**: web-client has working Supabase connection
- **22 tables**: Schema is defined with all relationships
- **Environment**: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY configured

### 🔧 To Implement Next

1. **Authentication**
   - [ ] Decide on auth method (Email/Password vs OAuth)
   - [ ] Create OAuth credentials if using Google/GitHub
   - [ ] Configure password reset email settings
   - [ ] Set JWT expiry and refresh token strategy

2. **Row Level Security (RLS)**
   - [ ] Define access rules per role (Admin, Manager, Employee, Customer, Supplier)
   - [ ] Test policies with different user roles
   - [ ] Document special cases (team access, two-factor auth, etc.)

3. **Database Indexes**
   - [ ] Add indexes for common queries (e.g., `user_id`, `batch_id`, `order_date`)
   - [ ] Monitor query performance after going live
   - Add suggested indexes:
     ```sql
     CREATE INDEX idx_orders_user_id ON ORDERS(user_id);
     CREATE INDEX idx_products_supplier ON PRODUCTS(supplier_id);
     CREATE INDEX idx_batches_product ON BATCHES(product_id);
     CREATE INDEX idx_orders_status ON ORDERS(status);
     CREATE INDEX idx_inventory_batch ON INVENTORY(batch_id);
     ```

4. **Storage Buckets**
   - [ ] Create public buckets: `product-images`, `receipts`, `posts`
   - [ ] Create private buckets: `user-avatars`, `certificates`
   - [ ] Set appropriate CORS policies
   - [ ] Configure retention/cleanup policies

5. **Realtime Configuration**
   - [ ] Enable Realtime for critical tables
   - [ ] Test subscription performance
   - [ ] Decide which events to broadcast (all vs specific columns)

6. **Backup & Recovery**
   - [ ] Enable automated backups
   - [ ] Test restore procedures
   - [ ] Document disaster recovery plan

7. **Monitoring & Analytics**
   - [ ] Set up database monitoring
   - [ ] Track API usage and costs
   - [ ] Monitor performance metrics
   - [ ] Set up alerts for suspicious activity

---

## Resources

- Official Supabase JS Client: https://supabase.com/docs/reference/javascript/introduction
- Supabase Dashboard: https://app.supabase.com
- PostgreSQL Docs (for advanced queries): https://www.postgresql.org/docs/
- RLS Best Practices: https://supabase.com/docs/guides/auth/row-level-security

---

**Last Updated**: March 19, 2026
