import { NextResponse } from "next/server";
import { resolveTenantScope } from "../../../../../../../backend/core/tenant-request";
import { createServiceRoleSupabaseClient } from "../../../../../../../backend/core/supabase";
import { AppError } from "../../../../../../../backend/core/errors";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ supplierId: string }> },
) {
  try {
    const scope = await resolveTenantScope(request);
    if (scope)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { supplierId } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(supplierId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await request.json().catch(() => null);
    if (!["approved", "rejected"].includes(body?.status))
      return NextResponse.json(
        { error: "Invalid review status" },
        { status: 400 },
      );
    const { data, error } = await createServiceRoleSupabaseClient()
      .from("suppliers")
      .update({ status: body.status })
      .eq("supplier_id", supplierId)
      .eq("status", "pending")
      .select("supplier_id,status")
      .maybeSingle();
    if (error) throw new Error("Could not update supplier status");
    if (!data)
      return NextResponse.json(
        { error: "Supplier not pending or not found" },
        { status: 409 },
      );
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof AppError ? e.message : "Không thể duyệt đối tác" },
      { status: e instanceof AppError ? e.statusCode : 503 },
    );
  }
}
