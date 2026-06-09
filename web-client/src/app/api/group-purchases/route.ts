import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { groupPurchaseFacade } from "../../../../backend/modules/group-purchases/facades/group-purchase.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

type JoinBody = {
  action?: "join" | "create";
  groupId?: string;
  group_id?: string;
  userId?: string;
  user_id?: string;
  quantity?: number;
  productId?: string;
  product_id?: string;
  targetQuantity?: number;
  target_quantity?: number;
  minQuantity?: number;
  min_quantity?: number;
  discountPrice?: number;
  discount_price?: number;
  deadline?: string;
};

export async function GET() {
  try {
    logger.info("List group purchases attempt");

    const start = Date.now();

    const items = await groupPurchaseFacade.listGroups();

    logger.info("List group purchases success", {
      count: Array.isArray(items) ? items.length : 0,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List group purchases failed", {
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("List group purchases unexpected error", {
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let userId = "";

  try {
    const body = (await request.json()) as JoinBody;

    const action = body.action ?? "join";
    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";

    logger.info("Group purchase action attempt", {
      userId,
      action,
    });

    if (action === "create") {
      const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
      const targetQuantity = Number(
        body.targetQuantity ?? body.target_quantity ?? 0
      );
      const minQuantity = Number(
        body.minQuantity ?? body.min_quantity ?? 0
      );
      const discountPriceRaw =
        body.discountPrice ?? body.discount_price;
      const deadline = body.deadline?.trim() ?? "";

      if (!userId || !productId || !deadline) {
        logger.error("Create group purchase failed - missing fields", {
          userId,
          productId,
          deadline,
        });

        return NextResponse.json(
          { error: "userId, productId and deadline are required" },
          { status: 400 }
        );
      }

      const start = Date.now();

      const result = await groupPurchaseFacade.createGroup({
        userId,
        productId,
        targetQuantity,
        minQuantity,
        discountPrice:
          typeof discountPriceRaw === "undefined"
            ? undefined
            : Number(discountPriceRaw),
        deadline,
      });

      logger.info("Create group purchase success", {
        userId,
        productId,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json(result, { status: 201 });
    }

    const groupId =
      body.groupId?.trim() ?? body.group_id?.trim() ?? "";
    const quantity = Number(body.quantity ?? 1);

    if (!groupId || !userId) {
      logger.error("Join group purchase failed - missing fields", {
        userId,
        groupId,
      });

      return NextResponse.json(
        { error: "groupId and userId are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await groupPurchaseFacade.joinGroup({
      groupId,
      userId,
      quantity,
    });

    logger.info("Join group purchase success", {
      userId,
      groupId,
      quantity,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Group purchase action failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Group purchase action unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
