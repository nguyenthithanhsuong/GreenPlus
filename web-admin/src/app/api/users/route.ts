import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { userManagementFacade } from "../../../../backend/modules/users/facades/user-management.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List users attempt");

  const start = Date.now();
  const items = await userManagementFacade.listUsers();

  logger.info("List users success", {
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
    roleId?: string | null;
    storeId?: string | null;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    address?: string;
    imageUrl?: string;
    status?: "active" | "inactive" | "banned";
  };

  logger.info("Create user attempt", {
    email: body.email,
  });

  const start = Date.now();

  const created = await userManagementFacade.createUser({
    roleId: body.roleId,
    storeId: body.storeId,
    name: body.name ?? "",
    email: body.email ?? "",
    password: body.password ?? "",
    phone: body.phone,
    address: body.address,
    imageUrl: body.imageUrl,
    status: body.status,
  });

  logger.info("Create user success", {
    userId: created.user_id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    created,
    { status: 201 },
  );
});