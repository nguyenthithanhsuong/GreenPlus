/** Shipper-only data boundary: never accept an employeeId from the client. */
import { AuthService } from "../auth/auth.service";
import { createServiceRoleSupabaseClient } from "../../core/supabase";

const states = ["assigned", "picked_up", "delivering", "delivered"] as const;
type Status = (typeof states)[number];
const next: Record<Status, Status | null> = {
  assigned: "picked_up",
  picked_up: "delivering",
  delivering: "delivered",
  delivered: null,
};

type DeliveryRow = {
  delivery_id: string;
  order_id: string;
  employee_id: string;
  status: string;
  pickup_time: string | null;
  delivery_time: string | null;
  orders: {
    delivery_address: string | null;
    total_amount: number | null;
    users: { name: string | null } | null;
  } | null;
};

export class ShipperDeliveryError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function requireShipper(request: Request): Promise<string> {
  const header = request.headers.get("authorization");
  if (!header || !/^Bearer \S+$/.test(header))
    throw new ShipperDeliveryError("Authentication required", 401);
  let identity;
  try {
    identity = await new AuthService().verifySession(header.slice(7));
  } catch {
    throw new ShipperDeliveryError("Invalid session", 401);
  }
  // Role in a custom token may be stale; re-check against the current database record.
  const db = createServiceRoleSupabaseClient();
  const { data, error } = await db
    .from("users")
    .select("user_id,status,roles!inner(is_shipper)")
    .eq("user_id", identity.id)
    .eq("roles.is_shipper", true)
    .maybeSingle();
  if (error) throw new ShipperDeliveryError("User lookup failed", 503);
  if (!data || data.status === "banned" || data.status === "inactive")
    throw new ShipperDeliveryError("Shipper access denied", 403);
  return identity.id;
}

function normalize(row: DeliveryRow) {
  return {
    delivery_id: row.delivery_id,
    order_id: row.order_id,
    customer_name: row.orders?.users?.name ?? "Khách hàng",
    delivery_address: row.orders?.delivery_address ?? "",
    total_amount: Number(row.orders?.total_amount ?? 0),
    status: row.status,
    pickup_time: row.pickup_time,
  };
}

const fields =
  "delivery_id,order_id,employee_id,status,pickup_time,delivery_time,orders(delivery_address,total_amount,users(name))";
export async function listMyDeliveries(employeeId: string) {
  const { data, error } = await createServiceRoleSupabaseClient()
    .from("deliveries")
    .select(fields)
    .eq("employee_id", employeeId)
    .order("delivery_id", { ascending: false })
    .limit(100);
  if (error) throw new ShipperDeliveryError("Could not load deliveries", 503);
  return (data as unknown as DeliveryRow[]).map(normalize);
}

export async function advanceMyDelivery(
  employeeId: string,
  orderId: string,
  target: unknown,
) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(orderId))
    throw new ShipperDeliveryError("Invalid order ID", 400);
  if (typeof target !== "string" || !states.some((s) => s === target))
    throw new ShipperDeliveryError("Invalid delivery status", 400);
  const db = createServiceRoleSupabaseClient();
  const { data: current, error: readError } = await db
    .from("deliveries")
    .select("delivery_id,status")
    .eq("order_id", orderId)
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (readError) throw new ShipperDeliveryError("Could not read delivery", 503);
  if (!current) throw new ShipperDeliveryError("Delivery not found", 404);
  if (
    !states.some((s) => s === current.status) ||
    next[current.status as Status] !== target
  )
    throw new ShipperDeliveryError("Invalid delivery status transition", 409);
  const timestamp = new Date().toISOString();
  const patch: Record<string, string> = { status: target };
  if (target === "picked_up") patch.pickup_time = timestamp;
  if (target === "delivered") patch.delivery_time = timestamp;
  // Compare-and-swap conditions prevent duplicate/concurrent updates from skipping states.
  const { data: changed, error: updateError } = await db
    .from("deliveries")
    .update(patch)
    .eq("delivery_id", current.delivery_id)
    .eq("employee_id", employeeId)
    .eq("status", current.status)
    .select(fields)
    .maybeSingle();
  if (updateError)
    throw new ShipperDeliveryError("Could not update delivery", 503);
  if (!changed)
    throw new ShipperDeliveryError("Delivery changed; refresh and retry", 409);
  return normalize(changed as unknown as DeliveryRow);
}
