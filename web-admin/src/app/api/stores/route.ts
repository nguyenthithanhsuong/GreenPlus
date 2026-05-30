import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { storesManagementFacade } from "../../../../backend/modules/stores/facades/stores-management.facade";

export async function GET() {
  try {
    const items = await storesManagementFacade.listStores();
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