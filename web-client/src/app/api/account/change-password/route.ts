import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export async function PUT(request: Request) {
  let userId = "";

  try {
    const body = (await request.json()) as {
      userId?: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    userId = body.userId ?? "";

    logger.info("Change password attempt", { userId });
    const start = Date.now();

    const data = await authFacade.changePassword({
      userId,
      currentPassword: body.currentPassword ?? "",
      newPassword: body.newPassword ?? "",
      confirmPassword: body.confirmPassword ?? "",
    });

    logger.info("Change password success", { userId, duration_ms: Date.now() - start });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Change password failed", { userId, message: error.message, status: error.statusCode });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Change password unexpected error", { userId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
