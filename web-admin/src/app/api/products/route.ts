import { NextResponse } from "next/server";
import { ProductService } from "../../../../backend/modules/catalog/product.service";

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
