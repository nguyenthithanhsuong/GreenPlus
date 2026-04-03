import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get("userId") ?? "").trim();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const data = await authFacade.getProfile(userId);
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

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      name?: string;
      phone?: string;
      address?: string;
      imageUrl?: string;
    };

    const data = await authFacade.updateProfile({
      userId: body.userId ?? "",
      name: body.name ?? "",
      phone: body.phone ?? "",
      address: body.address,
      imageUrl: body.imageUrl,
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
