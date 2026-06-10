import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "@/lib/logger"; 

export const PUT = withSentry(async (request: Request) => {
  const body = (await request.json()) as {
    userId?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const userId = body.userId ?? "";

  logger.info("Change password attempt", { userId });

  const start = Date.now();

  const data = await authFacade.changePassword({
    userId,
    currentPassword: body.currentPassword ?? "",
    newPassword: body.newPassword ?? "",
    confirmPassword: body.confirmPassword ?? "",
  });

  logger.info("Change password success", {
    userId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(data, { status: 200 });
});