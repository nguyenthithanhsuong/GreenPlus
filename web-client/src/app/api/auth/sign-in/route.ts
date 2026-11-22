import { readBoundedJson } from "../../../../../../packages/ai-core/response.mjs";
import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { AuthRepository } from "../../../../../backend/modules/customer-auth/auth.repository";
import { logger } from "@/lib/logger";

export const POST = withSentry(async (request: Request) => {
  const body = (await readBoundedJson(request,{maxBytes:8192}).catch(error=>{
    throw new AppError(error instanceof Error?error.message:"Invalid JSON",Number(error?.status) || 400);
  })) as {
    email?: string;
    password?: string;
  };

  const email = typeof body.email === "string" ? body.email : "";
  if (email.length > 254 || typeof body.password !== "string" || body.password.length > 1024)
    throw new AppError("Email hoặc mật khẩu không hợp lệ",400);

  logger.info("Login attempt");

  const start = Date.now();

  try {
    const data = await authFacade.signIn({
      email,
      password: body.password ?? "",
    });

    logger.info("Login success", {
      duration_ms: Date.now() - start,
    });

    const response = NextResponse.json(data, { status: 200 });

    if (data.session.access_token) {
      response.cookies.set("gp_customer_auth", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    if (!(error instanceof AppError)) {
      throw error;
    }

    const errorResponse: {
      error: string;
      status?: string;
    } = {
      error: error.message,
    };

    if (error.message.includes("account is not active") && email) {
      try {
        const repo = new AuthRepository();

        const user = await repo.findUserByEmail(email.trim().toLowerCase());

        if (user) {
          errorResponse.status = user.status;

          if (user.status === "banned") {
            logger.warn("Login blocked: account banned");
          } else {
            logger.warn("Login blocked: account inactive/suspended", {
              status: user.status,
            });
          }
        }
      } catch {}
    } else {
      logger.warn("Login failed", { status: error.statusCode });
    }

    return NextResponse.json(errorResponse, { status: error.statusCode });
  }
});
