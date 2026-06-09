import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/admin-auth/facades/auth.facade";
import { AuthRepository as AdminAuthRepository } from "../../../../../backend/modules/admin-auth/auth.repository";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

const ALLOWED_ROLES = new Set(["admin", "manager", "employee"]);

export const POST = withSentry(async (request) => {
  const start = Date.now();
  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  logger.info("Admin sign-in attempt", { email });

  if (!email || !password) {
    logger.error("Admin sign-in failed - missing credentials");
    throw new AppError("Email and password are required", 400);
  }

  let data;
  try {
    data = await authFacade.signIn({ email, password });
  } catch (error) {
    if (error instanceof AppError && error.message.includes("account is not active") && email) {
      const errorResponse: { error: string; status?: string } = { error: error.message };
      try {
        const repo = new AdminAuthRepository();
        const user = await repo.findUserByEmail(email.trim().toLowerCase());
        if (user) errorResponse.status = user.status;
      } catch {
        logger.error("Failed to fetch status for inactive account", { email });
      }
      logger.warn("Admin sign-in failed", { email, message: error.message });
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }
    throw error; 
  }

  const roleName = typeof data.role_name === "string" ? data.role_name.toLowerCase() : "";

  if (!roleName || !ALLOWED_ROLES.has(roleName)) {
    logger.warn("Admin sign-in blocked - unauthorized role", { email, roleName });
    throw new AppError("Only admin, manager, or employee can access this portal", 403);
  }

  logger.info("Admin sign-in success", {
    email,
    roleName,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json({
    session: data.session,
    user: { ...data.user, role_name: roleName },
    role_name: roleName || null,
  });
});