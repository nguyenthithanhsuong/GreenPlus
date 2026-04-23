import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { roleManagementFacade } from "../../../../../backend/modules/roles/facades/role-management.facade";

type Context = {
  params: Promise<{
    roleId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { roleId } = await context.params;
    const body = (await request.json()) as {
      roleName?: string;
      description?: string | null;
    };

    const updated = await roleManagementFacade.updateRole({
      roleId,
      roleName: body.roleName,
      description: body.description,
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
    const { roleId } = await context.params;
    const body = (await request.json()) as {
      action?: "rename";
      roleName?: string;
      description?: string | null;
    };

    if (body.action === "rename") {
      const updated = await roleManagementFacade.updateRole({
        roleId,
        roleName: body.roleName,
        description: body.description,
      });

      return NextResponse.json(updated, { status: 200 });
    }

    return NextResponse.json({ error: "action is required" }, { status: 400 });
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
    const { roleId } = await context.params;
    await roleManagementFacade.deleteRole(roleId);
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
