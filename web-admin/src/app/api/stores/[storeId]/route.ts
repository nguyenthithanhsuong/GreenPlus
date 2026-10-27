import { resolveDeliveryAddress, LocationError } from "../../../../../../packages/location/index.mjs";
import { portalActor } from "../../../../../backend/core/manager-scope";
import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { storesManagementFacade } from "../../../../../backend/modules/stores/facades/stores-management.facade";
import { logger } from "@/lib/logger";

type Context = {
  params: Promise<{
    storeId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  const actor = await portalActor(request);
  if (actor.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { storeId } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      address?: string;
      ward?: string | null;
      district?: string | null;
      city?: string | null;
      phone?: string | null;
      email?: string | null;
      managerId?: string;
      status?: "active" | "inactive" | "closed";
      latitude?: number | string | null;
      longitude?: number | string | null;
      openingTime?: string | null;
      closingTime?: string | null;
    };

    let location;
    if (typeof body.address === "string") {
      try {
        location = await resolveDeliveryAddress([body.address, body.ward, body.district, body.city].filter(Boolean).join(", "));
      } catch(error) {
        return NextResponse.json({error:error instanceof Error ? error.message : "Địa chỉ cửa hàng không xác thực được"}, {status:error instanceof LocationError ? error.status : 422});
      }
    }
    logger.info("Update store attempt", { storeId, name: body.name });

    const start = Date.now();
    const updated = await storesManagementFacade.updateStore({
      storeId,
      name: body.name,
      description: body.description,
      address: body.address,
      ward: body.ward,
      district: body.district,
      city: body.city,
      phone: body.phone,
      email: body.email,
      managerId: body.managerId,
      status: body.status,
      latitude: location?.latitude,
      longitude: location?.longitude,
      openingTime: body.openingTime,
      closingTime: body.closingTime,
    });

    logger.info("Update store success", {
      storeId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update store failed", { storeId, message: error.message });
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logger.error("Update store unexpected error", {
      storeId,
      error: toErrorMessage(error),
    });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const actor = await portalActor(request);
  if (actor.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { storeId } = await context.params;

  try {
    const body = (await request.json()) as {
      status?: "active" | "inactive" | "closed";
    };

    if (typeof body.status === "undefined") {
      logger.warn("Patch store status failed - missing status", { storeId });
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    logger.info("Change store status attempt", {
      storeId,
      status: body.status,
    });

    const start = Date.now();
    const updated = await storesManagementFacade.changeStatus(
      storeId,
      body.status,
    );

    logger.info("Change store status success", {
      storeId,
      status: body.status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Change store status failed", {
        storeId,
        message: error.message,
      });
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logger.error("Change store status unexpected error", {
      storeId,
      error: toErrorMessage(error),
    });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const actor = await portalActor(request);
  if (actor.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { storeId } = await context.params;

  logger.info("Delete store attempt", { storeId });

  try {
    const start = Date.now();
    await storesManagementFacade.deleteStore(storeId);

    logger.info("Delete store success", {
      storeId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete store failed", { storeId, message: error.message });
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logger.error("Delete store unexpected error", {
      storeId,
      error: toErrorMessage(error),
    });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
