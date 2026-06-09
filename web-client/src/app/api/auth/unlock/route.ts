import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export async function POST(request: Request) {
  let email = "";

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    email = body.email ?? "";

    logger.info("Unlock account attempt", { email });

    const start = Date.now();

    const data = await authFacade.unlockAccount({
      email,
      password: body.password ?? "",
    });

    logger.info("Unlock account success", {
      email,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Unlock account failed", {
        email,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Unlock account unexpected error", {
      email,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}