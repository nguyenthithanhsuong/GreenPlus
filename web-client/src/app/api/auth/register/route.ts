import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export const POST = withSentry(async (request) => {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };

  const email = body.email ?? "";

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
});