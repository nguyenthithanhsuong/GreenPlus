import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { userManagementFacade } from "../../../../../backend/modules/users/facades/user-management.facade";
import { logger } from "@/lib/logger";
import {
  portalActor,
  assertManagerEmployeeTarget,
} from "../../../../../backend/core/manager-scope";
import { AppError } from "../../../../../backend/core/errors";
import { verifiedUserAddress } from "../../../../../backend/core/user-address.mjs";
import { resolveDeliveryAddress, LocationError } from "../../../../../../packages/location/index.mjs";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export const PUT = withSentry(async (request: Request, context: Context) => {
  const { userId } = await context.params;
  const actor = await portalActor(request);
  if (actor.role === "manager")
    await assertManagerEmployeeTarget(actor.id, userId);

  const body = (await request.json()) as {
    roleId?: string | null;
    storeId?: string | null;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    locationHint?: {latitude:number;longitude:number};
    imageUrl?: string;
    status?: "active" | "inactive" | "banned";
  };

  if (
    actor.role === "manager" &&
    (body.roleId !== undefined || body.storeId !== undefined)
  )
    throw new AppError("Manager cannot change employee role or store", 403);

  logger.info("Update user attempt", {
    userId,
    email: body.email,
  });

  const start = Date.now();

  let verified;
  if (body.address !== undefined) {
    // Existing profiles can be edited without replacing the address. Re-geocode
    // only when supplied; updates with an address must always be validated.
    try { verified = await verifiedUserAddress(body.address, resolveDeliveryAddress, body.locationHint); }
    catch (error) { throw new AppError(error instanceof Error ? error.message : "Invalid address", error instanceof LocationError ? error.status : 422); }
  }

  const updated = await userManagementFacade.updateUser({
    userId,
    roleId: body.roleId,
    storeId: body.storeId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: verified?.address,
    latitude: verified?.latitude,
    longitude: verified?.longitude,
    imageUrl: body.imageUrl,
    status: body.status,
  });

  logger.info("Update user success", {
    userId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(updated, { status: 200 });
});

export const PATCH = withSentry(async (request: Request, context: Context) => {
  const { userId } = await context.params;
  const actor = await portalActor(request);
  if (actor.role === "manager")
    await assertManagerEmployeeTarget(actor.id, userId);

  const body = (await request.json()) as {
    action?: "disable";
    status?: "active" | "inactive" | "banned";
  };

  if (body.action === "disable") {
    logger.info("Disable user attempt", {
      userId,
    });

    const start = Date.now();

    const disabled = await userManagementFacade.disableUser(userId);

    logger.info("Disable user success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(disabled, {
      status: 200,
    });
  }

  if (typeof body.status !== "undefined") {
    logger.info("Change user status attempt", {
      userId,
      status: body.status,
    });

    const start = Date.now();

    const updated = await userManagementFacade.updateUser({
      userId,
      status: body.status,
    });

    logger.info("Change user status success", {
      userId,
      status: body.status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, {
      status: 200,
    });
  }

  logger.warn("Patch user failed - invalid input", {
    userId,
  });

  return NextResponse.json(
    { error: "action or status is required" },
    { status: 400 },
  );
});

export const DELETE = withSentry(async (request: Request, context: Context) => {
  const { userId } = await context.params;
  const actor = await portalActor(request);
  if (actor.role !== "admin")
    throw new AppError("Only Admin may delete accounts", 403);

  logger.info("Delete user attempt", {
    userId,
  });

  const start = Date.now();

  await userManagementFacade.deleteUser(userId);

  logger.info("Delete user success", {
    userId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json({ deleted: true }, { status: 200 });
});
