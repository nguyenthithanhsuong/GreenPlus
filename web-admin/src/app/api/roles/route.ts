import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { roleManagementFacade } from "../../../../backend/modules/roles/facades/role-management.facade";

export async function GET() {
  try {
    const items = await roleManagementFacade.listRoles();
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
      roleName?: string;
      description?: string;
      isCustomer?: boolean;
      isAdmin?: boolean;
      isManager?: boolean;
      isEmployee?: boolean;
      isShipper?: boolean;
    };

    const created = await roleManagementFacade.createRole({
      roleName: body.roleName ?? "",
      description: body.description,
      isCustomer: body.isCustomer,
      isAdmin: body.isAdmin,
      isManager: body.isManager,
      isEmployee: body.isEmployee,
      isShipper: body.isShipper,
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
