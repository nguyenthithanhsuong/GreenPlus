import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { storesManagementFacade } from "../../../../../backend/modules/stores/facades/stores-management.facade";

type Context = {
  params: Promise<{
    storeId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { storeId } = await context.params;
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
      latitude: body.latitude,
      longitude: body.longitude,
      openingTime: body.openingTime,
      closingTime: body.closingTime,
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
    const { storeId } = await context.params;
    const body = (await request.json()) as {
      status?: "active" | "inactive" | "closed";
    };

    if (typeof body.status === "undefined") {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const updated = await storesManagementFacade.changeStatus(storeId, body.status);
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

export async function DELETE(_: Request, context: Context) {
  try {
    const { storeId } = await context.params;
    await storesManagementFacade.deleteStore(storeId);
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