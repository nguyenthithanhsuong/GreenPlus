import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { cartFacade } from "../../../../backend/modules/cart/facades/cart.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

type CartMutationBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  quantity?: number;
};

export async function GET(request: Request) {
  let userId = "";

  try {
    const { searchParams } = new URL(request.url);
    userId =
      searchParams.get("userId")?.trim() ??
      searchParams.get("user_id")?.trim() ??
      "";

    logger.info("Get cart attempt", { userId });

    if (!userId) {
      logger.error("Get cart failed - missing userId", { userId });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const cart = await cartFacade.getCart(userId);

    logger.info("Get cart success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Get cart failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Get cart unexpected error", {
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
   ADD ITEM
========================= */
export async function POST(request: Request) {
  let userId = "";
  let productId = "";

  try {
    const body = (await request.json()) as CartMutationBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const quantity = Number(body.quantity);

    logger.info("Add cart item attempt", { userId, productId, quantity });

    if (!userId || !productId || Number.isNaN(quantity)) {
      logger.error("Add cart item failed - invalid input", {
        userId,
        productId,
        quantity,
      });

      return NextResponse.json(
        { error: "userId, productId and quantity are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const cart = await cartFacade.addItem(userId, productId, quantity);

    logger.info("Add cart item success", {
      userId,
      productId,
      quantity,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Add cart item failed", {
        userId,
        productId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Add cart item unexpected error", {
      userId,
      productId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  let userId = "";
  let productId = "";

  try {
    const body = (await request.json()) as CartMutationBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const quantity = Number(body.quantity);

    logger.info("Update cart item quantity attempt", {
      userId,
      productId,
      quantity,
    });

    if (!userId || !productId || Number.isNaN(quantity)) {
      logger.error("Update cart item failed - invalid input", {
        userId,
        productId,
        quantity,
      });

      return NextResponse.json(
        { error: "userId, productId and quantity are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const cart = await cartFacade.updateItemQuantity(
      userId,
      productId,
      quantity
    );

    logger.info("Update cart item success", {
      userId,
      productId,
      quantity,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update cart item failed", {
        userId,
        productId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Update cart item unexpected error", {
      userId,
      productId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  let userId = "";
  let productId = "";

  try {
    const body = (await request.json()) as CartMutationBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";

    logger.info("Remove cart item attempt", { userId, productId });

    if (!userId || !productId) {
      logger.error("Remove cart item failed - missing identifiers", {
        userId,
        productId,
      });

      return NextResponse.json(
        { error: "userId and productId are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const cart = await cartFacade.removeItem(userId, productId);

    logger.info("Remove cart item success", {
      userId,
      productId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Remove cart item failed", {
        userId,
        productId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Remove cart item unexpected error", {
      userId,
      productId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}