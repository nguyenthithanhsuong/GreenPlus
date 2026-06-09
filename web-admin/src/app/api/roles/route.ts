import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { roleManagementFacade } from "../../../../backend/modules/roles/facades/role-management.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List roles attempt");

  try {
    const start = Date.now();
    const items = await roleManagementFacade.listRoles();

    logger.info("List roles success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List roles failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List roles unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roleName?: string;
      description?: string;
      isCustomer?: boolean;
      isAdmin?: boolean;
      isManager?: boolean;
      isEmployee?: boolean;
      isShipper?: boolean;
    };

    logger.info("Create role attempt", { roleName: body.roleName });

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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create role failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create role unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
