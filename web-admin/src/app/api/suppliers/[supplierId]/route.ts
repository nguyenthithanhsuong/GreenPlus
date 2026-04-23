import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { supplierManagementFacade } from "../../../../../backend/modules/suppliers/facades/supplier-management.facade";

type Context = {
  params: Promise<{
    supplierId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { supplierId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      address?: string;
      certificate?: string | null;
      description?: string | null;
      status?: "pending" | "approved" | "rejected";
    };

    const updated = await supplierManagementFacade.updateSupplier({
      supplierId,
      name: body.name,
      address: body.address,
      certificate: body.certificate,
      description: body.description,
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
    const { supplierId } = await context.params;
    const body = (await request.json()) as {
      action?: "approve" | "reject";
      status?: "pending" | "approved" | "rejected";
    };

    if (body.action === "approve") {
      const updated = await supplierManagementFacade.changeStatus(supplierId, "approved");
      return NextResponse.json(updated, { status: 200 });
    }

    if (body.action === "reject") {
      const updated = await supplierManagementFacade.changeStatus(supplierId, "rejected");
      return NextResponse.json(updated, { status: 200 });
    }

    if (typeof body.status !== "undefined") {
      const updated = await supplierManagementFacade.changeStatus(supplierId, body.status);
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
    const { supplierId } = await context.params;
    await supplierManagementFacade.deleteSupplier(supplierId);
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
