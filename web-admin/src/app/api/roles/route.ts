import { portalActor } from "../../../../backend/core/manager-scope";
import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { roleManagementFacade } from "../../../../backend/modules/roles/facades/role-management.facade";
import { logger } from "@/lib/logger";

export const GET = withSentry(async (request: Request) => {
  const actor = await portalActor(request);
  logger.info("List roles attempt");

  const start = Date.now();

  let items = await roleManagementFacade.listRoles();
  if (actor.role === "manager")
    items = items.filter((role) => role.is_employee === true);

  logger.info("List roles success", {
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
  if (actor.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json()) as {
    roleName?: string;
    description?: string;
    isCustomer?: boolean;
    isAdmin?: boolean;
    isManager?: boolean;
    isEmployee?: boolean;
    isShipper?: boolean;
  };

  logger.info("Create role attempt", {
    roleName: body.roleName,
  });

  const start = Date.now();

  const created = await roleManagementFacade.createRole({
    roleName: body.roleName ?? "",
    description: body.description,
    isCustomer: body.isCustomer,
    isAdmin: body.isAdmin,
    isManager: body.isManager,
    isEmployee: body.isEmployee,
    isShipper: body.isShipper,
  });

  logger.info("Create role success", {
    roleId: created.role_id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(created, {
    status: 201,
  });
});
