import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { authFacade } from "../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export async function GET(request: Request) {
  let userId = "";

  try {
    const { searchParams } = new URL(request.url);
    userId = (searchParams.get("userId") ?? "").trim();

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
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Get profile failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Get profile unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE PROFILE
========================= */
export async function PUT(request: Request) {
  let userId = "";

  try {
    const body = (await request.json()) as {
      userId?: string;
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      imageUrl?: string;
    };

    userId = (body.userId ?? "").trim();

    logger.info("Update profile attempt", { userId });

    if (!userId) {
      logger.error("Update profile failed - missing userId", { userId });
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
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
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update profile failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Update profile unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
