import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { roleManagementFacade } from "../../../../../backend/modules/roles/facades/role-management.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    roleId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  const { roleId } = await context.params;

  try {
    const body = (await request.json()) as {
      roleName?: string;
      description?: string | null;
      isCustomer?: boolean;
      isAdmin?: boolean;
      isManager?: boolean;
      isEmployee?: boolean;
      isShipper?: boolean;
    };

    logger.info("Update role attempt", { roleId, roleName: body.roleName });

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
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update role failed", { roleId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update role unexpected error", { roleId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const { roleId } = await context.params;

  try {
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
      logger.warn("Patch role failed - invalid action", { roleId, action: body.action });
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    logger.info("Rename role attempt", { roleId, roleName: body.roleName });

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
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Rename role failed", { roleId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Rename role unexpected error", { roleId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: Context) {
  const { roleId } = await context.params;

  logger.info("Delete role attempt", { roleId });

  try {
    const start = Date.now();
    await roleManagementFacade.deleteRole(roleId);
    
    logger.info("Delete role success", {
      roleId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete role failed", { roleId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Delete role unexpected error", { roleId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}