import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { cartFacade } from "../../../../backend/modules/cart/facades/cart.facade";
import {
  assertCustomerId,
  requireCustomerIdentity,
} from "../../../../backend/core/request-auth";
import { logger } from "@/lib/logger";

type CartMutationBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  quantity?: number;
};

export const GET = withSentry(async (request: Request) => {
  const identity = requireCustomerIdentity(request);
  const { searchParams } = new URL(request.url);

  const userId = assertCustomerId(
    searchParams.get("userId") ?? searchParams.get("user_id") ?? undefined,
    identity.userId,
  );

  logger.info("Get cart attempt", { userId });

  if (!userId) {
    logger.error("Get cart failed - missing userId", { userId });

    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const start = Date.now();

  const cart = await cartFacade.getCart(userId);

  logger.info("Get cart success", {
    userId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(cart, { status: 200 });
});

export const POST = withSentry(async (request: Request) => {
  const identity = requireCustomerIdentity(request);
  const body = (await request.json()) as CartMutationBody;

  const userId = assertCustomerId(body.userId ?? body.user_id, identity.userId);

  const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";

  const quantity = Number(body.quantity);

  logger.info("Add cart item attempt", {
    userId,
    productId,
    quantity,
  });

  if (!userId || !productId || Number.isNaN(quantity)) {
    logger.error("Add cart item failed - invalid input", {
      userId,
      productId,
      quantity,
    });

    return NextResponse.json(
      {
        error: "userId, productId and quantity are required",
      },
      { status: 400 },
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
});

export const PUT = withSentry(async (request: Request) => {
  const identity = requireCustomerIdentity(request);
  const body = (await request.json()) as CartMutationBody;

  const userId = assertCustomerId(body.userId ?? body.user_id, identity.userId);

  const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";

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
      {
        error: "userId, productId and quantity are required",
      },
      { status: 400 },
    );
  }

  const start = Date.now();

  const cart = await cartFacade.updateItemQuantity(userId, productId, quantity);

  logger.info("Update cart item success", {
    userId,
    productId,
    quantity,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(cart, { status: 200 });
});

export const DELETE = withSentry(async (request: Request) => {
  const identity = requireCustomerIdentity(request);
  const body = (await request.json()) as CartMutationBody;

  const userId = assertCustomerId(body.userId ?? body.user_id, identity.userId);

  const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";

  logger.info("Remove cart item attempt", {
    userId,
    productId,
  });

  if (!userId || !productId) {
    logger.error("Remove cart item failed - missing identifiers", {
      userId,
      productId,
    });

    return NextResponse.json(
      { error: "userId and productId are required" },
      { status: 400 },
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
});
