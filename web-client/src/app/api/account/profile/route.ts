import { resolveDeliveryAddress, LocationError } from "../../../../../../packages/location/index.mjs";
import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import {
  assertCustomerId,
  requireCustomerIdentity,
} from "../../../../../backend/core/request-auth";
import { logger } from "@/lib/logger";

export const GET = withSentry(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const identity = requireCustomerIdentity(request);
  const userId = assertCustomerId(
    searchParams.get("userId") ?? undefined,
    identity.userId,
  );

  logger.info("Get profile attempt", { userId });

  if (!userId) {
    logger.error("Get profile failed - missing userId", { userId });

    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const start = Date.now();

  const data = await authFacade.getProfile(userId);

  logger.info("Get profile success", {
    userId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(data, { status: 200 });
});

export const PUT = withSentry(async (request: Request) => {
  const identity = requireCustomerIdentity(request);
  const body = (await request.json()) as {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    locationHint?: {latitude:number;longitude:number};
    imageUrl?: string;
  };

  const userId = assertCustomerId(body.userId, identity.userId);

  logger.info("Update profile attempt", { userId });

  if (!userId) {
    logger.error("Update profile failed - missing userId", { userId });

    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  let location;
  try {
    if (body.address !== undefined) {
      if (!body.address.trim()) throw new LocationError('Địa chỉ giao hàng không được để trống.');
      location = await resolveDeliveryAddress(body.address, body.locationHint);
    }
  } catch (error) {
    return NextResponse.json({error:error instanceof Error ? error.message : "Địa chỉ chưa được xác thực"}, {status:error instanceof LocationError ? error.status : 422});
  }
  const start = Date.now();

  const data = await authFacade.updateProfile({
    userId,
    name: body.name ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    address: body.address,
    latitude: location?.latitude,
    longitude: location?.longitude,
    imageUrl: body.imageUrl,
  });

  logger.info("Update profile success", {
    userId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(data, { status: 200 });
});
