import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { userManagementFacade } from "../../../../../backend/modules/users/facades/user-management.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  const { userId } = await context.params;

  try {
    const body = (await request.json()) as {
      roleId?: string | null;
      storeId?: string | null;
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      imageUrl?: string;
      status?: "active" | "inactive" | "banned";
    };

    logger.info("Update user attempt", { userId, email: body.email });

    const start = Date.now();
    const updated = await userManagementFacade.updateUser({
      userId,
      roleId: body.roleId,
      storeId: body.storeId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      imageUrl: body.imageUrl,
      status: body.status,
    });

    logger.info("Update user success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update user failed", { userId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update user unexpected error", { userId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const { userId } = await context.params;

  try {
    const body = (await request.json()) as {
      action?: "disable";
      status?: "active" | "inactive" | "banned";
    };

    if (body.action === "disable") {
      logger.info("Disable user attempt", { userId });
      const start = Date.now();
      const disabled = await userManagementFacade.disableUser(userId);
      logger.info("Disable user success", { userId, duration_ms: Date.now() - start });
      return NextResponse.json(disabled, { status: 200 });
    }

    if (typeof body.status !== "undefined") {
      logger.info("Change user status attempt", { userId, status: body.status });
      const start = Date.now();
      const updated = await userManagementFacade.updateUser({ userId, status: body.status });
      logger.info("Change user status success", { userId, status: body.status, duration_ms: Date.now() - start });
      return NextResponse.json(updated, { status: 200 });
    }

    logger.warn("Patch user failed - invalid input", { userId });
    return NextResponse.json({ error: "action or status is required" }, { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Patch user failed", { userId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Patch user unexpected error", { userId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: Context) {
  const { userId } = await context.params;

  logger.info("Delete user attempt", { userId });

  try {
    const start = Date.now();
    await userManagementFacade.deleteUser(userId);
    
    logger.info("Delete user success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete user failed", { userId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Delete user unexpected error", { userId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}