import { NextResponse } from "next/server";
import { resolveTenantScope } from "../../../../../backend/core/tenant-request";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";
import { AppError } from "../../../../../backend/core/errors";

export const runtime = "nodejs";
const formatMonth = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const count = async (table: string, filter?: { status: string }) => {
  let query = createServiceRoleSupabaseClient()
    .from(table)
    .select("*", { count: "exact", head: true });
  if (filter) query = query.eq("status", filter.status);
  const result = await query;
  if (result.error) throw new Error(`Failed ${table} count`);
  return result.count ?? 0;
};
export async function GET(request: Request) {
  try {
    // A null tenant scope is reserved for an authenticated platform admin.
    const scope = await resolveTenantScope(request);
    if (scope)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const db = createServiceRoleSupabaseClient();
    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const prevStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).toISOString();
    const sixStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [
      users,
      usersMonth,
      usersLast,
      suppliers,
      supplierTotal,
      complaints,
      posts,
    ] = await Promise.all([
      count("users"),
      db
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart),
      db
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart)
        .lt("created_at", monthStart),
      db
        .from("suppliers")
        .select("supplier_id,name,certificate,created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      count("suppliers", { status: "pending" }),
      count("complaints", { status: "pending" }),
      db
        .from("posts")
        .select("post_id,title,content,type,created_at,users(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    if (usersMonth.error || usersLast.error || suppliers.error || posts.error)
      throw new Error("Could not load global metrics");
    type Order = {
      user_id: string | null;
      total_amount: number | null;
      order_date: string | null;
      created_at: string | null;
    };
    const orders: Order[] = [];
    let partial = false;
    for (let offset = 0; offset < 10000; offset += 1000) {
      const { data, error } = await db
        .from("orders")
        .select("user_id,total_amount,order_date,created_at")
        .range(offset, offset + 999);
      if (error) throw new Error("Could not load global revenue");
      const chunk = (data ?? []) as Order[];
      orders.push(...chunk);
      if (chunk.length < 1000) break;
      if (offset === 9000) partial = true;
    }
    const six = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        key: formatMonth(date),
        label: date.toLocaleDateString("vi-VN", {
          month: "2-digit",
          year: "2-digit",
        }),
        revenue: 0,
        orders: 0,
      };
    });
    const customerSpend = new Map<string, { amount: number; orders: number }>();
    let totalRevenue = 0,
      thisRevenue = 0,
      lastRevenue = 0;
    for (const order of orders) {
      const amount = Number(order.total_amount ?? 0);
      totalRevenue += amount;
      const dateValue = order.order_date ?? order.created_at;
      const date = dateValue ? new Date(dateValue) : null;
      if (date && Number.isFinite(date.getTime())) {
        if (date >= new Date(monthStart)) thisRevenue += amount;
        else if (date >= new Date(prevStart)) lastRevenue += amount;
        if (date >= sixStart) {
          const bucket = six.find((item) => item.key === formatMonth(date));
          if (bucket) {
            bucket.revenue += amount;
            bucket.orders++;
          }
        }
      }
      if (order.user_id) {
        const customer = customerSpend.get(order.user_id) ?? {
          amount: 0,
          orders: 0,
        };
        customer.amount += amount;
        customer.orders++;
        customerSpend.set(order.user_id, customer);
      }
    }
    const sorted = [...customerSpend.values()].sort(
      (a, b) => b.amount - a.amount,
    );
    const vipCount = Math.ceil(sorted.length * 0.1);
    const vip = new Set(sorted.slice(0, vipCount));
    const returning = sorted.filter(
      (item) => !vip.has(item) && item.orders >= 2,
    ).length;
    const newcomers = sorted.filter(
      (item) => !vip.has(item) && item.orders === 1,
    ).length;
    return NextResponse.json(
      {
        users,
        usersMonth: usersMonth.count ?? 0,
        usersLast: usersLast.count ?? 0,
        totalRevenue,
        thisRevenue,
        lastRevenue,
        pendingSuppliers: suppliers.data ?? [],
        pendingSuppliersCount: supplierTotal,
        pendingComplaints: complaints,
        pendingPosts: posts.data ?? [],
        trend: six,
        segments: {
          vip: vipCount,
          returning,
          new: newcomers,
          total: sorted.length,
        },
        partial,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof AppError
            ? e.message
            : "Không tải được thống kê toàn nền tảng",
      },
      { status: e instanceof AppError ? e.statusCode : 503 },
    );
  }
}
