import { cookies } from "next/headers";
export const SESSION_COOKIE = "gp_shipper_session";
export async function sessionHeader() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? `Bearer ${token}` : null;
}
export function shipperBaseUrl() {
  const base = process.env.GREENPLUS_SHIPPER_API_BASE_URL;
  if (!base || !/^https?:\/\//.test(base))
    throw new Error("GREENPLUS_SHIPPER_API_BASE_URL required");
  return base.replace(/\/$/, "");
}
