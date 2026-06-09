import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { supplierManagementFacade } from "../../../../backend/modules/suppliers/facades/supplier-management.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List suppliers attempt");

  try {
    const start = Date.now();
    const items = await supplierManagementFacade.listSuppliers();

    logger.info("List suppliers success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List suppliers failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List suppliers unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
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

    logger.info("Create supplier attempt", { name: body.name });

    const start = Date.now();
    const created = await supplierManagementFacade.createSupplier({
      name: body.name ?? "",
      address: body.address ?? "",
      certificate: body.certificate,
      description: body.description,
      status: body.status,
    });

    logger.info("Create supplier success", {
      supplierId: created.supplier_id,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create supplier failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create supplier unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}