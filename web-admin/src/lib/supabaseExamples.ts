import { supabase } from "@/lib/supabaseClient";

export type InputField = {
  name: string;
  type: string;
  required: boolean;
  example?: string;
};

export type OperationDefinition = {
  description: string;
  query: string;
  inputFields?: InputField[];
  expectedReturn?: unknown;
  execute: (...args: string[]) => Promise<{ data: unknown; error: unknown }>;
};

export type TableDefinition = {
  table: string;
  idColumn: string;
};

const parsePayload = (raw: string): Record<string, unknown> => {
  if (!raw || raw.trim().length === 0) {
    throw new Error("payload_json is required and must be a valid JSON object.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("payload_json is invalid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("payload_json must be a JSON object, not array/string/number.");
  }

  return parsed as Record<string, unknown>;
};

const makeCrudOperations = (table: string, idColumn: string): Record<string, OperationDefinition> => ({
  select: {
    description: `Select first 20 rows from ${table}`,
    query: `supabase\n  .from("${table}")\n  .select("*")\n  .limit(20)`,
    expectedReturn: [
      {
        [idColumn]: "uuid",
      },
    ],
    execute: async () => {
      const { data, error } = await supabase.from(table).select("*").limit(20);
      return { data, error };
    },
  },
  selectById: {
    description: `Select a row from ${table} by ${idColumn}`,
    query: `supabase\n  .from("${table}")\n  .select("*")\n  .eq("${idColumn}", id)\n  .single()`,
    inputFields: [{ name: "id", type: "UUID", required: true, example: "uuid-here" }],
    execute: async (id: string) => {
      const { data, error } = await supabase.from(table).select("*").eq(idColumn, id).single();
      return { data, error };
    },
  },
  insert: {
    description: `Insert one row into ${table} using payload_json`,
    query: `supabase\n  .from("${table}")\n  .insert([payload])\n  .select()`,
    inputFields: [
      {
        name: "payload_json",
        type: "JSON object",
        required: true,
        example: '{"name":"sample"}',
      },
    ],
    execute: async (payloadJson: string) => {
      const payload = parsePayload(payloadJson);
      const { data, error } = await supabase.from(table).insert([payload]).select();
      return { data, error };
    },
  },
  updateById: {
    description: `Update row in ${table} by ${idColumn} using payload_json`,
    query: `supabase\n  .from("${table}")\n  .update(payload)\n  .eq("${idColumn}", id)\n  .select()`,
    inputFields: [
      { name: "id", type: "UUID", required: true, example: "uuid-here" },
      {
        name: "payload_json",
        type: "JSON object",
        required: true,
        example: '{"status":"active"}',
      },
    ],
    execute: async (id: string, payloadJson: string) => {
      const payload = parsePayload(payloadJson);
      const { data, error } = await supabase.from(table).update(payload).eq(idColumn, id).select();
      return { data, error };
    },
  },
  deleteById: {
    description: `Delete row in ${table} by ${idColumn}`,
    query: `supabase\n  .from("${table}")\n  .delete()\n  .eq("${idColumn}", id)`,
    inputFields: [{ name: "id", type: "UUID", required: true, example: "uuid-here" }],
    execute: async (id: string) => {
      const { data, error } = await supabase.from(table).delete().eq(idColumn, id).select();
      return { data, error };
    },
  },
});

export const tableDefinitions: TableDefinition[] = [
  { table: "roles", idColumn: "role_id" },
  { table: "users", idColumn: "user_id" },
  { table: "suppliers", idColumn: "supplier_id" },
  { table: "categories", idColumn: "category_id" },
  { table: "products", idColumn: "product_id" },
  { table: "batches", idColumn: "batch_id" },
  { table: "inventory", idColumn: "inventory_id" },
  { table: "inventory_transactions", idColumn: "transaction_id" },
  { table: "prices", idColumn: "price_id" },
  { table: "carts", idColumn: "cart_id" },
  { table: "cart_items", idColumn: "cart_item_id" },
  { table: "orders", idColumn: "order_id" },
  { table: "order_items", idColumn: "order_item_id" },
  { table: "order_tracking", idColumn: "tracking_id" },
  { table: "payments", idColumn: "payment_id" },
  { table: "deliveries", idColumn: "delivery_id" },
  { table: "complaints", idColumn: "complaint_id" },
  { table: "subscriptions", idColumn: "subscription_id" },
  { table: "posts", idColumn: "post_id" },
  { table: "group_buys", idColumn: "group_id" },
  { table: "group_buy_members", idColumn: "id" },
  { table: "reviews", idColumn: "review_id" },
];

export const allOperations = Object.fromEntries(
  tableDefinitions.map(({ table, idColumn }) => [table, makeCrudOperations(table, idColumn)])
);