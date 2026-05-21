import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import type { UserStatus } from "../../../../../backend/modules/customer-auth/auth.types";

const USER_STATUSES: UserStatus[] = ["active", "inactive", "banned", "suspended"];

function parseUserStatus(value?: string): UserStatus | null {
  return USER_STATUSES.includes(value as UserStatus)
    ? (value as UserStatus)
    : null;
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      status?: string;
    };

    const status = parseUserStatus(body.status);
    if (!status) {
      return NextResponse.json(
        { error: "status must be one of: active, inactive, banned, suspended" },
        { status: 400 },
      );
    }

    const data = await authFacade.updateAccountStatus({
      userId: body.userId ?? "",
      status,
    });

    return NextResponse.json(data, { status: 200 });
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
