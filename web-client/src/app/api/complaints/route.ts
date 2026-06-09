import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { complaintFacade } from "../../../../backend/modules/complaints/facades/complaint.facade";
import { ComplaintType } from "../../../../backend/modules/complaints/complaint.types";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

type ComplaintBody = {
  userId?: string;
  user_id?: string;
  orderId?: string;
  order_id?: string;
  type?: ComplaintType;
  description?: string;
};

export async function POST(request: Request) {
  let userId = "";
  let orderId = "";

  try {
    const body = (await request.json()) as ComplaintBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    orderId = body.orderId?.trim() ?? body.order_id?.trim() ?? "";
    const type = body.type;
    const description = body.description?.trim() ?? "";

    logger.info("Submit complaint attempt", {
      userId,
      orderId,
      type,
    });

    if (!userId || !orderId || !type || !description) {
      logger.error("Submit complaint failed - missing required fields", {
        userId,
        orderId,
        type,
      });

      return NextResponse.json(
        { error: "userId, orderId, type and description are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await complaintFacade.submitComplaint({
      userId,
      orderId,
      type,
      description,
    });

    logger.info("Submit complaint success", {
      userId,
      orderId,
      type,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Submit complaint failed", {
        userId,
        orderId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Submit complaint unexpected error", {
      userId,
      orderId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  let userId = "";

  try {
    const url = new URL(request.url);

    userId =
      (url.searchParams.get("userId") ??
        url.searchParams.get("user_id") ??
        "").trim();

    logger.info("List complaints attempt", { userId });

    if (!userId) {
      logger.error("List complaints failed - missing userId", {
        userId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const items =
      await complaintFacade.listComplaintsByUser(userId);

    logger.info("List complaints success", {
      userId,
      count: Array.isArray(items) ? items.length : 0,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List complaints failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("List complaints unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}