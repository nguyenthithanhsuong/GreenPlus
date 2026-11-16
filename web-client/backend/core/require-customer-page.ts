import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCustomerIdentity } from "./request-auth";
import { AppError } from "./errors";
import { supabaseServer } from "./supabase";

export async function requireCustomerPage(): Promise<void> {
  const token = (await cookies()).get("gp_customer_auth")?.value;
  if (!token) redirect("/login");
  let customerId: string;
  try {
    const request = new Request("http://greenplus.invalid/", {
      headers: { Cookie: `gp_customer_auth=${encodeURIComponent(token)}` },
    });
    customerId = requireCustomerIdentity(request).userId;
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) redirect("/login");
    throw error;
  }
  const { data, error } = await supabaseServer
    .from("users")
    .select("user_id,status,roles(role_name)")
    .eq("user_id", customerId)
    .maybeSingle();
  if (error) throw new Error("Không thể xác minh quyền truy cập khách hàng");
  if (!data || data.status !== "active") redirect("/login");
  const rawRole = data.roles as { role_name?: string } | Array<{ role_name?: string }> | null;
  const roleName = Array.isArray(rawRole) ? rawRole[0]?.role_name : rawRole?.role_name;
  if (roleName?.toLowerCase() !== "customer") redirect("/login");
}
