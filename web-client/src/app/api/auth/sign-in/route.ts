import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { AuthRepository } from "../../../../../backend/modules/customer-auth/auth.repository";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export const POST = withSentry(async (request) => {
  let email = "";

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    email = body.email ?? "";

    logger.info("Login attempt", { email });
    const start = Date.now();

    const data = await authFacade.signIn({
      email,
      password: body.password ?? "",
    });

    logger.info("Login success", { email, duration_ms: Date.now() - start });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse: { error: string; status?: string } = {
        error: error.message,
      };

      if (error.message.includes("account is not active") && email) {
        try {
          const repo = new AuthRepository();
          const user = await repo.findUserByEmail(email.trim().toLowerCase());
          if (user) {
            errorResponse.status = user.status;

            if (user.status === "banned") {
              logger.warn("Login blocked: account banned", { email });
            } else {
              logger.warn("Login blocked: account inactive/suspended", {
                email,
                status: user.status,
              });
            }
          }
        } catch {
        }
      } else {
        logger.error("Login failed", {
          email,
          message: error.message,
          status: error.statusCode,
        });
      }

      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    throw error;
  }
});