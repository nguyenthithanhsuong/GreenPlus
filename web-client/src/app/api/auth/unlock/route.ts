import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "@/lib/logger"; 

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email ?? "";

  logger.info("Unlock account attempt", { email });

  const start = Date.now();

  try {
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
    if (!(error instanceof AppError)) {
      throw error;
    }

    logger.error("Unlock account failed", {
      email,
      message: error.message,
      status: error.statusCode,
    });

    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }
});