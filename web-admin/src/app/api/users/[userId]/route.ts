import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { userManagementFacade } from "../../../../../backend/modules/users/facades/user-management.facade";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { userId } = await context.params;
    const body = (await request.json()) as {
      roleId?: string | null;
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      imageUrl?: string;
      status?: "active" | "inactive" | "banned";
    };

    const updated = await userManagementFacade.updateUser({
      userId,
      roleId: body.roleId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      imageUrl: body.imageUrl,
      status: body.status,
    });

    return NextResponse.json(updated, { status: 200 });
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

export async function PATCH(request: Request, context: Context) {
  try {
    const { userId } = await context.params;
    const body = (await request.json()) as {
      action?: "disable";
      status?: "active" | "inactive" | "banned";
    };

    if (body.action === "disable") {
      const disabled = await userManagementFacade.disableUser(userId);
      return NextResponse.json(disabled, { status: 200 });
    }

    if (typeof body.status !== "undefined") {
      const updated = await userManagementFacade.updateUser({ userId, status: body.status });
      return NextResponse.json(updated, { status: 200 });
    }

    return NextResponse.json({ error: "action or status is required" }, { status: 400 });
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

export async function DELETE(_: Request, context: Context) {
  try {
    const { userId } = await context.params;
    await userManagementFacade.deleteUser(userId);
    return NextResponse.json({ deleted: true }, { status: 200 });
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
