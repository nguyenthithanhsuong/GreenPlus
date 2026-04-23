import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { userManagementFacade } from "../../../../backend/modules/users/facades/user-management.facade";

export async function GET() {
  try {
    const items = await userManagementFacade.listUsers();
    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roleId?: string | null;
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      address?: string;
      imageUrl?: string;
      status?: "active" | "inactive" | "banned";
    };

    const created = await userManagementFacade.createUser({
      roleId: body.roleId,
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      phone: body.phone,
      address: body.address,
      imageUrl: body.imageUrl,
      status: body.status,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
