import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export async function POST(request: Request) {
  let email = "";

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };

    email = body.email ?? "";

    logger.info("Register attempt", { email, name: body.name ?? "" });
    const start = Date.now();

    const data = await authFacade.register({
      name: body.name ?? "",
      email,
      password: body.password ?? "",
      confirmPassword: body.confirmPassword ?? "",
    });

    logger.info("Register success", { email, duration_ms: Date.now() - start });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Register failed", { email, message: error.message, status: error.statusCode });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Register unexpected error", { email, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}