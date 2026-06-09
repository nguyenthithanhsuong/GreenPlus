import { NextResponse } from "next/server";
import { ProductService } from "../../../../backend/modules/catalog/product.service";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { AuthService } from "../../../../backend/modules/auth/auth.service";
import { requirePermissionForUser } from "../../../../backend/core/authorization";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List products attempt");

  try {
    const start = Date.now();
    const service = new ProductService();
    const items = await service.listProducts();

    logger.info("List products success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List products failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List products unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    let accessToken = "";
    if (authHeader.toLowerCase().startsWith("bearer ")) accessToken = authHeader.slice("bearer ".length).trim();
    const cookieHeader = request.headers.get("cookie") ?? "";
    if (!accessToken) {
      const cookieMatch = cookieHeader.match(/(?:^|;\s*)gp_portal_session=([^;]+)/);
      accessToken = cookieMatch ? decodeURIComponent(cookieMatch[1]).trim() : "";
    }

    if (!accessToken) {
      logger.warn("Create product failed - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    await requirePermissionForUser(verified.id, "products.create");

    const body = (await request.json()) as {
      categoryId?: string | null;
      name?: string;
      description?: string;
      unit?: string;
      imageUrl?: string;
      nutrition?: string;
      status?: "active" | "inactive";
    };

    logger.info("Create product attempt", { name: body.name, userId: verified.id });

    const start = Date.now();
    const service = new ProductService();
    const created = await service.createProduct({
      categoryId: body.categoryId,
      name: body.name ?? "",
      description: body.description,
      unit: body.unit ?? "",
      imageUrl: body.imageUrl,
      nutrition: body.nutrition,
      status: body.status,
    });

    logger.info("Create product success", {
      productId: created.product_id,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create product failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create product unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}