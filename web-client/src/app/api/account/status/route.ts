import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      status?: string;
    };

    const status = body.status;

if (
  status !== "active" &&
  status !== "inactive" &&
  status !== "banned" &&
  status !== "suspended"
) {
  return NextResponse.json(
    { error: "Invalid status" },
    { status: 400 }
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