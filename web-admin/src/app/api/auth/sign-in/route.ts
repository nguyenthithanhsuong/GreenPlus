import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/admin-auth/facades/auth.facade";

const ALLOWED_ROLES = new Set(["admin", "manager", "employee"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const data = await authFacade.signIn({
      email,
      password,
    });
    const roleName = typeof data.role_name === "string" ? data.role_name.toLowerCase() : "";
    if (!roleName || !ALLOWED_ROLES.has(roleName)) {
      throw new AppError("Only admin, manager, or employee can access this portal", 403);
    }

    return NextResponse.json({
      session: data.session,
      user: {
        ...data.user,
        role_name: roleName,
      },
      role_name: roleName || null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}