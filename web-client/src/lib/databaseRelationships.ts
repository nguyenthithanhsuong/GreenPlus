export type RelationshipType = "one-to-many" | "many-to-one" | "one-to-one";

export interface Relationship {
  targetTable: string;
  type: RelationshipType;
  foreignKey: string;
  description: string;
}

export interface TableRelationships {
  table: string;
  outgoing: Relationship[]; // This table references others
  incoming: Relationship[]; // Other tables reference this
  category: string;
}

export const ALL_RELATIONSHIPS: Record<string, TableRelationships> = {
  // 1. Identity & Access Relationships
  roles: {
    table: "roles",
    category: "Identity & Access",
    outgoing: [],
    incoming: [
      {
        targetTable: "users",
        type: "one-to-many",
        foreignKey: "users.role_id → roles.role_id",
        description: "1 role → many users",
      },
    ],
  },
  users: {
    table: "users",
    category: "Identity & Access",
    outgoing: [
      {
        targetTable: "roles",
        type: "many-to-one",
        foreignKey: "users.role_id → roles.role_id",
        description: "User assigned to role",
      },
    ],
    incoming: [
      {
        targetTable: "carts",
        type: "one-to-many",
        foreignKey: "carts.user_id → users.user_id",
        description: "1 user → 1 cart",
      },
      {
        targetTable: "orders",
        type: "one-to-many",
        foreignKey: "orders.user_id → users.user_id",
        description: "1 user → many orders",
      },
      {
        targetTable: "posts",
        type: "one-to-many",
        foreignKey: "posts.user_id → users.user_id",
        description: "1 user → many posts",
      },
      {
        targetTable: "reviews",
        type: "one-to-many",
        foreignKey: "reviews.user_id → users.user_id",
        description: "1 user → many reviews",
      },
      {
        targetTable: "complaints",
        type: "one-to-many",
        foreignKey: "complaints.user_id → users.user_id",
        description: "1 user → many complaints",
      },
      {
        targetTable: "subscriptions",
        type: "one-to-many",
        foreignKey: "subscriptions.user_id → users.user_id",
        description: "1 user → many subscriptions",
      },
      {
        targetTable: "deliveries",
        type: "one-to-many",
        foreignKey: "deliveries.employee_id → users.user_id",
        description: "Employee assigned deliveries",
      },
      {
        targetTable: "group_buys",
        type: "one-to-many",
        foreignKey: "group_buys.leader_id → users.user_id",
        description: "User leads group buy",
      },
      {
        targetTable: "group_buy_members",
        type: "one-to-many",
        foreignKey: "group_buy_members.user_id → users.user_id",
        description: "User is group buy member",
      },
    ],
  },

  // 2. Supply Chain & Products
  suppliers: {
    table: "suppliers",
    category: "Supply Chain & Products",
    outgoing: [],
    incoming: [
      {
        targetTable: "products",
        type: "one-to-many",
        foreignKey: "products.supplier_id → suppliers.supplier_id",
        description: "1 supplier → many products",
      },
      {
        targetTable: "batches",
        type: "one-to-many",
        foreignKey: "batches.supplier_id → suppliers.supplier_id",
        description: "Ensures traceability per batch",
      },
    ],
  },
  categories: {
    table: "categories",
    category: "Supply Chain & Products",
    outgoing: [],
    incoming: [
      {
        targetTable: "products",
        type: "one-to-many",
        foreignKey: "products.category_id → categories.category_id",
        description: "1 category → many products",
      },
    ],
  },
  products: {
    table: "products",
    category: "Supply Chain & Products",
    outgoing: [
      {
        targetTable: "suppliers",
        type: "many-to-one",
        foreignKey: "products.supplier_id → suppliers.supplier_id",
        description: "Product from supplier",
      },
      {
        targetTable: "categories",
        type: "many-to-one",
        foreignKey: "products.category_id → categories.category_id",
        description: "Product in category",
      },
    ],
    incoming: [
      {
        targetTable: "batches",
        type: "one-to-many",
        foreignKey: "batches.product_id → products.product_id",
        description: "1 product → many batches",
      },
      {
        targetTable: "prices",
        type: "one-to-many",
        foreignKey: "prices.product_id → products.product_id",
        description: "1 product → many prices",
      },
      {
        targetTable: "cart_items",
        type: "one-to-many",
        foreignKey: "cart_items.product_id → products.product_id",
        description: "Product in carts",
      },
      {
        targetTable: "order_items",
        type: "one-to-many",
        foreignKey: "order_items.product_id → products.product_id",
        description: "Product in orders",
      },
      {
        targetTable: "reviews",
        type: "one-to-many",
        foreignKey: "reviews.product_id → products.product_id",
        description: "Reviews for product",
      },
      {
        targetTable: "subscriptions",
        type: "one-to-many",
        foreignKey: "subscriptions.product_id → products.product_id",
        description: "Product subscriptions",
      },
      {
        targetTable: "group_buys",
        type: "one-to-many",
        foreignKey: "group_buys.product_id → products.product_id",
        description: "Group buys for product",
      },
    ],
  },
  batches: {
    table: "batches",
    category: "Supply Chain & Products",
    outgoing: [
      {
        targetTable: "products",
        type: "many-to-one",
        foreignKey: "batches.product_id → products.product_id",
        description: "Batch of product",
      },
      {
        targetTable: "suppliers",
        type: "many-to-one",
        foreignKey: "batches.supplier_id → suppliers.supplier_id",
        description: "Supplier of batch",
      },
    ],
    incoming: [
      {
        targetTable: "inventory",
        type: "one-to-one",
        foreignKey: "inventory.batch_id → batches.batch_id",
        description: "1 batch → 1 inventory record",
      },
      {
        targetTable: "inventory_transactions",
        type: "one-to-many",
        foreignKey: "inventory_transactions.batch_id → batches.batch_id",
        description: "1 batch → many transactions",
      },
      {
        targetTable: "prices",
        type: "one-to-many",
        foreignKey: "prices.batch_id → batches.batch_id",
        description: "Batch-level pricing",
      },
      {
        targetTable: "order_items",
        type: "one-to-many",
        foreignKey: "order_items.batch_id → batches.batch_id",
        description: "Batch traceability in orders",
      },
    ],
  },

  // 3. Inventory & Pricing
  inventory: {
    table: "inventory",
    category: "Inventory & Pricing",
    outgoing: [
      {
        targetTable: "batches",
        type: "many-to-one",
        foreignKey: "inventory.batch_id → batches.batch_id",
        description: "Inventory tracks batch",
      },
    ],
    incoming: [],
  },
  inventory_transactions: {
    table: "inventory_transactions",
    category: "Inventory & Pricing",
    outgoing: [
      {
        targetTable: "batches",
        type: "many-to-one",
        foreignKey: "inventory_transactions.batch_id → batches.batch_id",
        description: "Transaction for batch",
      },
    ],
    incoming: [],
  },
  prices: {
    table: "prices",
    category: "Inventory & Pricing",
    outgoing: [
      {
        targetTable: "products",
        type: "many-to-one",
        foreignKey: "prices.product_id → products.product_id",
        description: "Product-level pricing",
      },
      {
        targetTable: "batches",
        type: "many-to-one",
        foreignKey: "prices.batch_id → batches.batch_id",
        description: "Batch-level pricing",
      },
    ],
    incoming: [],
  },

  // 4. Shopping & Orders
  carts: {
    table: "carts",
    category: "Shopping & Orders",
    outgoing: [
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "carts.user_id → users.user_id",
        description: "Cart belongs to user",
      },
    ],
    incoming: [
      {
        targetTable: "cart_items",
        type: "one-to-many",
        foreignKey: "cart_items.cart_id → carts.cart_id",
        description: "1 cart → many items",
      },
    ],
  },
  cart_items: {
    table: "cart_items",
    category: "Shopping & Orders",
    outgoing: [
      {
        targetTable: "carts",
        type: "many-to-one",
        foreignKey: "cart_items.cart_id → carts.cart_id",
        description: "Item in cart",
      },
      {
        targetTable: "products",
        type: "many-to-one",
        foreignKey: "cart_items.product_id → products.product_id",
        description: "Cart item is product",
      },
    ],
    incoming: [],
  },
  orders: {
    table: "orders",
    category: "Shopping & Orders",
    outgoing: [
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "orders.user_id → users.user_id",
        description: "Order by user",
      },
    ],
    incoming: [
      {
        targetTable: "order_items",
        type: "one-to-many",
        foreignKey: "order_items.order_id → orders.order_id",
        description: "1 order → many items",
      },
      {
        targetTable: "order_tracking",
        type: "one-to-many",
        foreignKey: "order_tracking.order_id → orders.order_id",
        description: "1 order → many status logs",
      },
      {
        targetTable: "payments",
        type: "one-to-many",
        foreignKey: "payments.order_id → orders.order_id",
        description: "Usually 1 order → 1 payment",
      },
      {
        targetTable: "deliveries",
        type: "one-to-many",
        foreignKey: "deliveries.order_id → orders.order_id",
        description: "Order delivery",
      },
      {
        targetTable: "complaints",
        type: "one-to-many",
        foreignKey: "complaints.order_id → orders.order_id",
        description: "Complaints about order",
      },
    ],
  },
  order_items: {
    table: "order_items",
    category: "Shopping & Orders",
    outgoing: [
      {
        targetTable: "orders",
        type: "many-to-one",
        foreignKey: "order_items.order_id → orders.order_id",
        description: "Item in order",
      },
      {
        targetTable: "products",
        type: "many-to-one",
        foreignKey: "order_items.product_id → products.product_id",
        description: "Product ordered",
      },
      {
        targetTable: "batches",
        type: "many-to-one",
        foreignKey: "order_items.batch_id → batches.batch_id",
        description: "Batch for traceability",
      },
    ],
    incoming: [],
  },
  order_tracking: {
    table: "order_tracking",
    category: "Shopping & Orders",
    outgoing: [
      {
        targetTable: "orders",
        type: "many-to-one",
        foreignKey: "order_tracking.order_id → orders.order_id",
        description: "Status log for order",
      },
    ],
    incoming: [],
  },

  // 5. Fulfillment
  payments: {
    table: "payments",
    category: "Fulfillment",
    outgoing: [
      {
        targetTable: "orders",
        type: "many-to-one",
        foreignKey: "payments.order_id → orders.order_id",
        description: "Payment for order",
      },
    ],
    incoming: [],
  },
  deliveries: {
    table: "deliveries",
    category: "Fulfillment",
    outgoing: [
      {
        targetTable: "orders",
        type: "many-to-one",
        foreignKey: "deliveries.order_id → orders.order_id",
        description: "Delivery for order",
      },
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "deliveries.employee_id → users.user_id",
        description: "Employee (Shipper) role",
      },
    ],
    incoming: [],
  },

  // 6. Complaints
  complaints: {
    table: "complaints",
    category: "Complaints",
    outgoing: [
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "complaints.user_id → users.user_id",
        description: "Complaint by user",
      },
      {
        targetTable: "orders",
        type: "many-to-one",
        foreignKey: "complaints.order_id → orders.order_id",
        description: "Complaint about order",
      },
    ],
    incoming: [],
  },

  // 7. Subscriptions
  subscriptions: {
    table: "subscriptions",
    category: "Subscriptions",
    outgoing: [
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "subscriptions.user_id → users.user_id",
        description: "Subscription by user",
      },
      {
        targetTable: "products",
        type: "many-to-one",
        foreignKey: "subscriptions.product_id → products.product_id",
        description: "Recurring product",
      },
    ],
    incoming: [],
  },

  // 8. Social / Content
  posts: {
    table: "posts",
    category: "Social / Content",
    outgoing: [
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "posts.user_id → users.user_id",
        description: "Post by user",
      },
    ],
    incoming: [],
  },
  reviews: {
    table: "reviews",
    category: "Social / Content",
    outgoing: [
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "reviews.user_id → users.user_id",
        description: "Review by user",
      },
      {
        targetTable: "products",
        type: "many-to-one",
        foreignKey: "reviews.product_id → products.product_id",
        description: "Review for product",
      },
    ],
    incoming: [],
  },

  // 9. Group Buying System
  group_buys: {
    table: "group_buys",
    category: "Group Buying System",
    outgoing: [
      {
        targetTable: "products",
        type: "many-to-one",
        foreignKey: "group_buys.product_id → products.product_id",
        description: "Product for group buy",
      },
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "group_buys.leader_id → users.user_id",
        description: "Group buy leader",
      },
    ],
    incoming: [
      {
        targetTable: "group_buy_members",
        type: "one-to-many",
        foreignKey: "group_buy_members.group_buy_id → group_buys.group_buy_id",
        description: "Members in group buy",
      },
    ],
  },
  group_buy_members: {
    table: "group_buy_members",
    category: "Group Buying System",
    outgoing: [
      {
        targetTable: "group_buys",
        type: "many-to-one",
        foreignKey: "group_buy_members.group_buy_id → group_buys.group_buy_id",
        description: "Member of group buy",
      },
      {
        targetTable: "users",
        type: "many-to-one",
        foreignKey: "group_buy_members.user_id → users.user_id",
        description: "Group member user",
      },
    ],
    incoming: [],
  },
};

export function getRelationshipsForTable(tableName: string): TableRelationships | undefined {
  return ALL_RELATIONSHIPS[tableName];
}

export function getAllTables(): string[] {
  return Object.keys(ALL_RELATIONSHIPS);
}

export function getTablesByCategory(category: string): string[] {
  return Object.entries(ALL_RELATIONSHIPS)
    .filter(([_, rel]) => rel.category === category)
    .map(([table, _]) => table);
}



