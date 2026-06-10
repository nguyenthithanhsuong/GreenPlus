import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { complaintFacade } from "../../../../backend/modules/complaints/facades/complaint.facade";
import { ComplaintType } from "../../../../backend/modules/complaints/complaint.types";
import { logger } from "@/lib/logger"; 

type ComplaintBody = {
  userId?: string;
  user_id?: string;
  orderId?: string;
  order_id?: string;
  type?: ComplaintType;
  description?: string;
};

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as ComplaintBody;

  const userId =
    body.userId?.trim() ?? body.user_id?.trim() ?? "";

  const orderId =
    body.orderId?.trim() ?? body.order_id?.trim() ?? "";

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
      {
        error:
          "userId, orderId, type and description are required",
      },
      { status: 400 },
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
});

export const GET = withSentry(async (request: Request) => {
  const url = new URL(request.url);

  const userId =
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
      { status: 400 },
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
});