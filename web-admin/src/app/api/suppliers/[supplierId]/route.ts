import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { supplierManagementFacade } from "../../../../../backend/modules/suppliers/facades/supplier-management.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    supplierId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  const { supplierId } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      address?: string;
      certificate?: string | null;
      description?: string | null;
      status?: "pending" | "approved" | "rejected";
    };

    logger.info("Update supplier attempt", { supplierId, name: body.name });

    const start = Date.now();
    const updated = await supplierManagementFacade.updateSupplier({
      supplierId,
      name: body.name,
      address: body.address,
      certificate: body.certificate,
      description: body.description,
      status: body.status,
    });

    logger.info("Update supplier success", {
      supplierId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update supplier failed", { supplierId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update supplier unexpected error", { supplierId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const { supplierId } = await context.params;

  try {
    const body = (await request.json()) as {
      action?: "approve" | "reject";
      status?: "pending" | "approved" | "rejected";
    };

    const statusToSet = body.action === "approve" 
      ? "approved" 
      : body.action === "reject" 
        ? "rejected" 
        : body.status;

    if (!statusToSet) {
      logger.warn("Change supplier status failed - missing status", { supplierId });
      return NextResponse.json({ error: "action or status is required" }, { status: 400 });
    }

    logger.info("Change supplier status attempt", { supplierId, status: statusToSet });

    const start = Date.now();
    const updated = await supplierManagementFacade.changeStatus(supplierId, statusToSet);

    logger.info("Change supplier status success", {
      supplierId,
      status: statusToSet,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Change supplier status failed", { supplierId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Change supplier status unexpected error", { supplierId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: Context) {
  const { supplierId } = await context.params;

  logger.info("Delete supplier attempt", { supplierId });

  try {
    const start = Date.now();
    await supplierManagementFacade.deleteSupplier(supplierId);
    
    logger.info("Delete supplier success", {
      supplierId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete supplier failed", { supplierId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Delete supplier unexpected error", { supplierId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
