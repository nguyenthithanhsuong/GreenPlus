import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { userManagementFacade } from "../../../../backend/modules/users/facades/user-management.facade";
import { logger } from "@/lib/logger";
import {
  portalActor,
  managerStoreIds,
  assertEmployeeRoleId,
} from "../../../../backend/core/manager-scope";
import { createServiceRoleSupabaseClient } from "../../../../backend/core/supabase";
import { AppError } from "../../../../backend/core/errors";

export const GET = withSentry(async (request: Request) => {
  const actor = await portalActor(request);
  logger.info("List users attempt");

  const start = Date.now();
  let items = await userManagementFacade.listUsers();
  if (actor.role === "manager") {
    const ids = await managerStoreIds(actor.id);
    const db = createServiceRoleSupabaseClient();
    const { data: assigned, error } = await db
      .from("store_members")
      .select("user_id")
      .in(
        "store_id",
        ids.length ? ids : ["00000000-0000-0000-0000-000000000000"],
      )
      .eq("status", "active");
    if (error) throw new AppError("Failed to filter employees", 503);
    const assignedIds = new Set(
      (assigned ?? []).map((row) => String(row.user_id)),
    );
    items = items.filter(
      (u) =>
        u.role_name?.toLowerCase() === "employee" &&
        (ids.includes(u.store_id ?? "") || assignedIds.has(u.user_id)),
    );
  }

  logger.info("List users success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    {
      items,
      total: items.length,
    },
    { status: 200 },
  );
});

export const POST = withSentry(async (request: Request) => {
  const actor = await portalActor(request);
  const body = (await request.json()) as {
    roleId?: string | null;
    storeId?: string | null;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    address?: string;
    imageUrl?: string;
    status?: "active" | "inactive" | "banned";
  };

  if (actor.role === "manager") {
    await assertEmployeeRoleId(body.roleId);
    const stores = await managerStoreIds(actor.id);
    if (!body.storeId || !stores.includes(body.storeId))
      throw new AppError("Forbidden", 403);
  }

  logger.info("Create user attempt", {
    email: body.email,
  });

  const start = Date.now();

  const created = await userManagementFacade.createUser({
    roleId: body.roleId,
    storeId: body.storeId,
    name: body.name ?? "",
    email: body.email ?? "",
    password: body.password ?? "",
    phone: body.phone,
    address: body.address,
    imageUrl: body.imageUrl,
    status: body.status,
  });

  if (actor.role === "manager" && body.storeId && body.roleId) {
    const { error } = await createServiceRoleSupabaseClient()
      .from("store_members")
      .upsert(
        {
          user_id: created.user_id,
          store_id: body.storeId,
          role_id: body.roleId,
          status: "active",
        },
        { onConflict: "store_id,user_id" },
      );
    if (error)
      throw new AppError(
        "User created but store membership failed; contact administrator",
        503,
      );
  }

  logger.info("Create user success", {
    userId: created.user_id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(created, { status: 201 });
});
