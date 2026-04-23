export type AccessAction = "select" | "insert" | "update" | "delete";

export type AppSurface = "web-admin" | "web-client";

export type AppUseCase = {
  key: string;
  title: string;
  description: string;
  tables: string[];
};

export type RolePolicy = {
  role: "admin" | "manager" | "employee" | "customer" | "supplier";
  description: string;
  tableAccess: Partial<Record<AccessAction, string[]>>;
};

export const APP_USE_CASES: Record<AppSurface, AppUseCase[]> = {
  "web-admin": [
    {
      key: "user-governance",
      title: "User and Role Governance",
      description: "Manage users, roles, supplier approval, and account status.",
      tables: ["roles", "users", "suppliers"],
    },
    {
      key: "catalog-and-supply",
      title: "Catalog and Supply Management",
      description: "Manage categories, products, batches, prices, and inventory lifecycle.",
      tables: [
        "categories",
        "products",
        "batches",
        "prices",
        "inventory",
        "inventory_transactions",
      ],
    },
    {
      key: "operations",
      title: "Order and Fulfillment Operations",
      description: "Monitor and process orders, payments, deliveries, and complaints.",
      tables: [
        "orders",
        "order_items",
        "payments",
        "deliveries",
        "complaints",
      ],
    },
    {
      key: "content-and-analytics",
      title: "Content Moderation and Reporting",
      description: "Moderate posts and reviews; review platform-level business metrics.",
      tables: ["posts", "reviews", "group_buys", "group_buy_members", "subscriptions"],
    },
  ],
  "web-client": [
    {
      key: "discovery",
      title: "Product Discovery",
      description: "Browse active products, categories, batches, and pricing.",
      tables: ["categories", "products", "batches", "prices"],
    },
    {
      key: "shopping",
      title: "Shopping and Checkout",
      description: "Manage own cart and place own orders with payment tracking.",
      tables: ["carts", "cart_items", "orders", "order_items", "payments", "deliveries"],
    },
    {
      key: "engagement",
      title: "Community and Loyalty",
      description: "Post reviews, join group buys, subscribe, and read community posts.",
      tables: ["reviews", "group_buys", "group_buy_members", "subscriptions", "posts"],
    },
    {
      key: "self-service",
      title: "Profile Self-Service",
      description: "View and update own profile only.",
      tables: ["users"],
    },
  ],
};

export const ROLE_POLICIES: RolePolicy[] = [
  {
    role: "admin",
    description: "Full platform access across users, catalog, orders, and supplier operations.",
    tableAccess: {
      select: ["*"],
      insert: ["*"],
      update: ["*"],
      delete: ["*"],
    },
  },
  {
    role: "manager",
    description: "Inventory and order operations access; no full user governance.",
    tableAccess: {
      select: [
        "orders",
        "order_items",
        "deliveries",
        "payments",
        "complaints",
        "products",
        "batches",
        "inventory",
        "inventory_transactions",
        "prices",
        "categories",
      ],
      insert: ["batches", "inventory_transactions", "prices"],
      update: ["products", "batches", "inventory", "prices", "orders", "deliveries", "complaints"],
    },
  },
  {
    role: "employee",
    description: "Delivery staff can view and update only assigned deliveries and related order progress.",
    tableAccess: {
      select: ["deliveries", , "orders"],
      update: ["deliveries", "order_tracking"],
    },
  },
  {
    role: "customer",
    description: "Customers can access active catalog and manage only their own profile, cart, orders, and reviews.",
    tableAccess: {
      select: [
        "users",
        "categories",
        "products",
        "batches",
        "prices",
        "carts",
        "cart_items",
        "orders",
        "order_items",
        "order_tracking",
        "deliveries",
        "reviews",
        "group_buys",
        "group_buy_members",
        "subscriptions",
        "posts",
      ],
      insert: ["orders", "cart_items", "reviews", "group_buy_members", "subscriptions"],
      update: ["users", "carts", "cart_items", "reviews", "subscriptions"],
      delete: ["cart_items", "subscriptions"],
    },
  },
  {
    role: "supplier",
    description: "Suppliers can manage only their own products and batches.",
    tableAccess: {
      select: ["suppliers", "products", "batches", "inventory", "prices"],
      insert: ["products", "batches"],
      update: ["products", "batches"],
    },
  },
];

export const CLIENT_VISIBLE_TABLES = [
  "categories",
  "products",
  "batches",
  "prices",
  "posts",
  "reviews",
  "group_buys",
  "group_buy_members",
  "subscriptions",
  "carts",
  "cart_items",
  "orders",
  "order_items",
  "order_tracking",
  "payments",
  "deliveries",
  "users",
];

export const ADMIN_CORE_TABLES = [
  "roles",
  "users",
  "suppliers",
  "categories",
  "products",
  "batches",
  "inventory",
  "inventory_transactions",
  "prices",
  "orders",
  "order_items",
  "order_tracking",
  "payments",
  "deliveries",
  "complaints",
  "posts",
  "reviews",
  "group_buys",
  "group_buy_members",
  "subscriptions",
  "carts",
  "cart_items",
];

export function getPolicyForRole(role: RolePolicy["role"]): RolePolicy | undefined {
  return ROLE_POLICIES.find((policy) => policy.role === role);
}

export function canRoleAccessTable(role: RolePolicy["role"], action: AccessAction, table: string): boolean {
  const policy = getPolicyForRole(role);
  if (!policy) return false;

  const allowed = policy.tableAccess[action] ?? [];
  return allowed.includes("*") || allowed.includes(table);
}
