import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { productManagementFacade } from "../../../../../backend/modules/catalog/facades/product-management.facade";
import { logger } from "@/lib/logger"; 

type Context = {
  params: Promise<{
    productId: string;
  }>;
};

type DeleteProductBody = {
  force?: boolean;
};

export const PUT = withSentry(
  async (request: Request, context: Context) => {
    const { productId } = await context.params;

    const body = (await request.json()) as {
      categoryId?: string | null;
      name?: string;
      description?: string | null;
      unit?: string;
      imageUrl?: string | null;
      nutrition?: string | null;
      status?: "active" | "inactive";
    };

    logger.info("Update product attempt", {
      productId,
      name: body.name,
    });

    const start = Date.now();

    const updated = await productManagementFacade.updateProduct({
      productId,
      categoryId: body.categoryId,
      name: body.name,
      description: body.description,
      unit: body.unit,
      imageUrl: body.imageUrl,
      nutrition: body.nutrition,
      status: body.status,
    });

    logger.info("Update product success", {
      productId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  },
);

export const PATCH = withSentry(
  async (request: Request, context: Context) => {
    const { productId } = await context.params;

    const body = (await request.json()) as {
      action?: "activate" | "deactivate";
      status?: "active" | "inactive";
    };

    const statusToSet =
      body.action === "activate"
        ? "active"
        : body.action === "deactivate"
          ? "inactive"
          : body.status;

    if (!statusToSet) {
      logger.warn(
        "Change product status failed - missing status",
        { productId },
      );

      return NextResponse.json(
        { error: "action or status is required" },
        { status: 400 },
      );
    }

    logger.info("Change product status attempt", {
      productId,
      status: statusToSet,
    });

    const start = Date.now();

    const updated = await productManagementFacade.changeStatus(
      productId,
      statusToSet,
    );

    logger.info("Change product status success", {
      productId,
      status: statusToSet,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  },
);

export const DELETE = withSentry(
  async (request: Request, context: Context) => {
    const { productId } = await context.params;

    const body = (await request.json().catch(
      (): DeleteProductBody => ({})
    )) as DeleteProductBody;

    logger.info("Delete product attempt", {
      productId,
      force: !!body.force,
    });

    const start = Date.now();

    await productManagementFacade.deleteProduct(
      productId,
      Boolean(body.force),
    );

    logger.info("Delete product success", {
      productId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      { deleted: true },
      { status: 200 },
    );
  },
);