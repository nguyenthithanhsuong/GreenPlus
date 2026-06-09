import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { userManagementFacade } from "../../../../backend/modules/users/facades/user-management.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List users attempt");

  try {
    const start = Date.now();
    const items = await userManagementFacade.listUsers();

    logger.info("List users success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List users failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List users unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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

    logger.info("Create user attempt", { email: body.email });

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

    logger.info("Create user success", {
      userId: created.user_id,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create user failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create user unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}