import { NextResponse } from "next/server";
import { ProductService } from "../../../../backend/modules/catalog/product.service";
import { AppError } from "../../../../backend/core/errors";
import { AuthService } from "../../../../backend/modules/auth/auth.service";
import { requirePermissionForUser } from "../../../../backend/core/authorization";

export async function GET() {
  try {
    const service = new ProductService();
    const items = await service.listProducts();

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
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

    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
