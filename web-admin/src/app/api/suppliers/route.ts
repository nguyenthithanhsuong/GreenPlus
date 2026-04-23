import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { supplierManagementFacade } from "../../../../backend/modules/suppliers/facades/supplier-management.facade";

export async function GET() {
  try {
    const items = await supplierManagementFacade.listSuppliers();
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
      name?: string;
      address?: string;
      certificate?: string;
      description?: string;
      status?: "pending" | "approved" | "rejected";
    };

    const created = await supplierManagementFacade.createSupplier({
      name: body.name ?? "",
      address: body.address ?? "",
      certificate: body.certificate,
      description: body.description,
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
