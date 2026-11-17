import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { AiError } from "./errors";

export const aiDb = () => createServiceRoleSupabaseClient();
export function resultOrFail<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new AiError("Không truy cập được dữ liệu AI trong Supabase. Kiểm tra migration 0016–0019, service-role và kết nối database.", 503);
  if (data === null) throw new AiError("Không tìm thấy dữ liệu", 404);
  return data;
}
export function boundedItems<T>(items: T[] | null, limit: number): T[] {
  return (items ?? []).slice(0, limit);
}
