import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { ProductService } from "../../../../backend/modules/catalog/product.service";
import { AuthService } from "../../../../backend/modules/auth/auth.service";
import { requirePermissionForUser } from "../../../../backend/core/authorization";
import { logger } from "@/lib/logger"; 

function readAccessToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? "";

  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice("bearer ".length).trim();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(
    /(?:^|;\s*)gp_portal_session=([^;]+)/,
  );

  return cookieMatch
    ? decodeURIComponent(cookieMatch[1]).trim()
    : "";
}

export const GET = withSentry(async () => {
  logger.info("List products attempt");

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
    { status: 200 },
  );
});

export const POST = withSentry(async (request: Request) => {
  const accessToken = readAccessToken(request);

  if (!accessToken) {
    logger.warn("Create product failed - unauthorized");

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const authService = new AuthService();
  const verified = await authService.verifySession(accessToken);

  await requirePermissionForUser(
    verified.id,
    "products.create",
  );

  const body = (await request.json()) as {
    categoryId?: string | null;
    name?: string;
    description?: string;
    unit?: string;
    imageUrl?: string;
    nutrition?: string;
    status?: "active" | "inactive";
  };

  logger.info("Create product attempt", {
    name: body.name,
    userId: verified.id,
  });

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

  return NextResponse.json(created, {
    status: 201,
  });
});