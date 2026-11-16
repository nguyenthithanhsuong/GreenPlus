import { resolveTenantScope } from "../../core/tenant-request";
import { portalActor } from "../../core/manager-scope";
import { AiError } from "./errors";
import type { AiActor, AiRole } from "./types";
import { validUuid, canAi } from "../../../../packages/ai-core/policy.mjs";

export async function requireAiActor(request: Request, ability: string, requestedStore?: string | null): Promise<AiActor> {
  const selected = requestedStore?.trim() || null;
  if (selected && !validUuid(selected)) throw new AiError("Mã cửa hàng không hợp lệ", 400);
  const headers = new Headers(request.headers);
  if (selected) headers.set("x-greenplus-store-id", selected);
  const scope = await resolveTenantScope(new Request(request.url, { headers }));
  let role: AiRole;
  let id: string;
  let storeId: string;
  if (scope) {
    role = scope.role;
    id = scope.userId;
    storeId = scope.storeIds[0];
  } else {
    const admin = await portalActor(request);
    if (admin.role !== "admin") throw new AiError("Không có quyền", 403);
    role = "admin";
    id = admin.id;
    storeId = selected ?? "";
  }
  if (!canAi(role, ability)) throw new AiError("Vai trò không được phép sử dụng chức năng này", 403);
  if (!validUuid(storeId)) throw new AiError("Vui lòng chọn cửa hàng hợp lệ", 400);
  return { id, role, storeId };
}
