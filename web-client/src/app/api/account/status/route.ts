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
      status?: string;
    };

    userId = body.userId ?? "";
    const status = body.status;

    logger.info("Update account status attempt", { userId, status });

    if (!userId) {
      logger.error("Update account status failed - missing userId", { userId, status });
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (
      status !== "active" &&
      status !== "inactive" &&
      status !== "banned" &&
      status !== "suspended"
    ) {
      logger.error("Update account status failed - invalid status", { userId, status });
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const data = await authFacade.updateAccountStatus({
      userId,
      status,
    });

    logger.info("Update account status success", {
      userId,
      status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update account status failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Update account status unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
