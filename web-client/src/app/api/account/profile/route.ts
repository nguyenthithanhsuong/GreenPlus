import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim();

  logger.info("Get profile attempt", { userId });

  if (!userId) {
    logger.error("Get profile failed - missing userId", { userId });

    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
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
  const body = (await request.json()) as {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    imageUrl?: string;
  };

  const userId = (body.userId ?? "").trim();

  logger.info("Update profile attempt", { userId });

  if (!userId) {
    logger.error("Update profile failed - missing userId", { userId });

    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
  }

  const start = Date.now();

  const data = await authFacade.updateProfile({
    userId,
    name: body.name ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    address: body.address,
    imageUrl: body.imageUrl,
  });

  logger.info("Update profile success", {
    userId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(data, { status: 200 });
});