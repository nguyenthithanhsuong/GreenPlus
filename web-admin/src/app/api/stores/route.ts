import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { storesManagementFacade } from "../../../../backend/modules/stores/facades/stores-management.facade";
import { logger } from "@/lib/logger"; 

export async function GET() {
  logger.info("List stores attempt");

  try {
    const start = Date.now();
    const items = await storesManagementFacade.listStores();

    logger.info("List stores success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List stores failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List stores unexpected error", { error: toErrorMessage(error) });
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

    logger.info("Create store attempt", { name: body.name });

    const start = Date.now();
    const created = await storesManagementFacade.createStore({
      name: body.name ?? "",
      description: body.description,
      address: body.address ?? "",
      ward: body.ward,
      district: body.district,
      city: body.city,
      phone: body.phone,
      email: body.email,
      managerId: body.managerId ?? "",
      status: body.status,
      latitude: body.latitude,
      longitude: body.longitude,
      openingTime: body.openingTime,
      closingTime: body.closingTime,
    });

    logger.info("Create store success", {
      storeId: created.store_id,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create store failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create store unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
