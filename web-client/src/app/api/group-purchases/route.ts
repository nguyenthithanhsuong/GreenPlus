import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { groupPurchaseFacade } from "../../../../backend/modules/group-purchases/facades/group-purchase.facade";

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
    const items = await groupPurchaseFacade.listGroups();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as JoinBody;
    const action = body.action ?? "join";
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";

    if (action === "create") {
      const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
      const targetQuantity = Number(body.targetQuantity ?? body.target_quantity ?? 0);
      const minQuantity = Number(body.minQuantity ?? body.min_quantity ?? 0);
      const discountPriceRaw = body.discountPrice ?? body.discount_price;
      const deadline = body.deadline?.trim() ?? "";

      if (!userId || !productId || !deadline) {
        return NextResponse.json({ error: "userId, productId and deadline are required" }, { status: 400 });
      }

      const result = await groupPurchaseFacade.createGroup({
        userId,
        productId,
        targetQuantity,
        minQuantity,
        discountPrice: typeof discountPriceRaw === "undefined" ? undefined : Number(discountPriceRaw),
        deadline,
      });

      return NextResponse.json(result, { status: 201 });
    }

    const groupId = body.groupId?.trim() ?? body.group_id?.trim() ?? "";
    const quantity = Number(body.quantity ?? 1);

    if (!groupId || !userId) {
      return NextResponse.json({ error: "groupId and userId are required" }, { status: 400 });
    }

    const result = await groupPurchaseFacade.joinGroup({ groupId, userId, quantity });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
