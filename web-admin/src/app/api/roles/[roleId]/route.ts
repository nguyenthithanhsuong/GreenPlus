import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { roleManagementFacade } from "../../../../../backend/modules/roles/facades/role-management.facade";
import { logger } from "@/lib/logger"; 

type Context = {
  params: Promise<{
    roleId: string;
  }>;
};

export const PUT = withSentry(
  async (request: Request, context: Context) => {
    const { roleId } = await context.params;

    const body = (await request.json()) as {
      roleName?: string;
      description?: string | null;
      isCustomer?: boolean;
      isAdmin?: boolean;
      isManager?: boolean;
      isEmployee?: boolean;
      isShipper?: boolean;
    };

    logger.info("Update role attempt", {
      roleId,
      roleName: body.roleName,
    });

    const start = Date.now();

    const updated = await roleManagementFacade.updateRole({
      roleId,
      roleName: body.roleName,
      description: body.description,
      isCustomer: body.isCustomer,
      isAdmin: body.isAdmin,
      isManager: body.isManager,
      isEmployee: body.isEmployee,
      isShipper: body.isShipper,
    });

    logger.info("Update role success", {
      roleId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  },
);

export const PATCH = withSentry(
  async (request: Request, context: Context) => {
    const { roleId } = await context.params;

    const body = (await request.json()) as {
      action?: "rename";
      roleName?: string;
      description?: string | null;
      isCustomer?: boolean;
      isAdmin?: boolean;
      isManager?: boolean;
      isEmployee?: boolean;
      isShipper?: boolean;
    };

    if (body.action !== "rename") {
      logger.warn("Patch role failed - invalid action", {
        roleId,
        action: body.action,
      });

      return NextResponse.json(
        { error: "action is required" },
        { status: 400 },
      );
    }

    logger.info("Rename role attempt", {
      roleId,
      roleName: body.roleName,
    });

    const start = Date.now();

    const updated = await roleManagementFacade.updateRole({
      roleId,
      roleName: body.roleName,
      description: body.description,
      isCustomer: body.isCustomer,
      isAdmin: body.isAdmin,
      isManager: body.isManager,
      isEmployee: body.isEmployee,
      isShipper: body.isShipper,
    });

    logger.info("Rename role success", {
      roleId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  },
);

export const DELETE = withSentry(
  async (_: Request, context: Context) => {
    const { roleId } = await context.params;

    logger.info("Delete role attempt", { roleId });

    const start = Date.now();

    await roleManagementFacade.deleteRole(roleId);

    logger.info("Delete role success", {
      roleId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      { deleted: true },
      { status: 200 },
    );
  },
);