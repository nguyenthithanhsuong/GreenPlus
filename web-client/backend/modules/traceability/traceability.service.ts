import { AppError } from "../../core/errors";
import { createQrParseStrategy } from "./qr-parser.strategy";
import { readRelValue, TraceabilityRepository } from "./traceability.repository";

export type ProductOriginInfo = {
  product_name: string;
  supplier_name: string | null;
  production_location: string | null;
  harvest_date: string;
  expire_date: string;
  certification: string | null;
  batch_number: string;
};

export class TraceabilityService {
  private readonly repository = new TraceabilityRepository();

  async getOriginByQr(rawQr: string): Promise<ProductOriginInfo> {
    const qrPayload = createQrParseStrategy().parse(rawQr);

    let batchData: {
      batch_id: string;
      product_id: string;
      harvest_date: string;
      expire_date: string;
    } | null = null;
    try {
      batchData = await this.repository.findBatchById(qrPayload.batchId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load batch", 500);
    }

    if (!batchData) {
      throw new AppError("MSG2: Batch not found", 404);
    }

    const batch = batchData;
    if (batch.product_id !== qrPayload.productId) {
      throw new AppError("MSG1: QR product_id does not match batch", 400);
    }

    let productData: {
      product_id: string;
      name: string;
      status: "active" | "inactive";
      suppliers: Record<string, unknown> | Record<string, unknown>[] | null;
    } | null = null;
    try {
      productData = await this.repository.findProductWithSupplierById(qrPayload.productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load product", 500);
    }

    if (!productData) {
      throw new AppError("Product not found", 404);
    }

    const product = productData;
    if (product.status !== "active") {
      throw new AppError("MSG3: Product is inactive", 400);
    }

    return {
      product_name: product.name,
      supplier_name: readRelValue<string>(product.suppliers, "name"),
      production_location: readRelValue<string>(product.suppliers, "address"),
      harvest_date: batch.harvest_date,
      expire_date: batch.expire_date,
      certification: readRelValue<string>(product.suppliers, "certificate"),
      batch_number: batch.batch_id,
    };
  }
}
