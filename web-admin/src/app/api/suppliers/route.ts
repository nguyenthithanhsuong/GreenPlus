import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { supplierManagementFacade } from "../../../../backend/modules/suppliers/facades/supplier-management.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List suppliers attempt");

  const start = Date.now();

  const items = await supplierManagementFacade.listSuppliers();

  logger.info("List suppliers success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    {
      items,
      total: items.length,
    },
    { status: 200 },
  );
});

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as {
    name?: string;
    address?: string;
    certificate?: string;
    description?: string;
    status?: "pending" | "approved" | "rejected";
  };

  logger.info("Create supplier attempt", {
    name: body.name,
  });

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

  return NextResponse.json(created, {
    status: 201,
  });
});