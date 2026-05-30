import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { AuthRepository } from "../../../../../backend/modules/customer-auth/auth.repository";

export async function POST(request: Request) {
  let email = "";
  
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    email = body.email ?? "";

    const data = await authFacade.signIn({
      email,
      password: body.password ?? "",
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse: { error: string; status?: string } = { 
        error: error.message 
      };

      if (error.message.includes("account is not active") && email) {
        try {
          const repo = new AuthRepository();
          const user = await repo.findUserByEmail(email.trim().toLowerCase());
          if (user) {
            errorResponse.status = user.status;
          }
        } catch {
        }
      }

      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
