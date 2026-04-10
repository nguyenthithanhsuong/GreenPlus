import { AppError } from "../../core/errors";
import { createQrParseStrategy } from "./qr-parser.strategy";
import { TraceabilityRepository } from "./traceability.repository";

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

  private async toOriginInfoFromBatch(batchData: {
    batch_id: string;
    product_id: string;
    supplier_id: string;
    harvest_date: string;
    expire_date: string;
  }): Promise<ProductOriginInfo> {
    let productData: {
      product_id: string;
      name: string;
      status: "active" | "inactive";
      suppliers: Record<string, unknown> | Record<string, unknown>[] | null;
    } | null = null;

    try {
      productData = await this.repository.findProductById(batchData.product_id);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load product", 500);
    }

    if (!productData) {
      throw new AppError("Product not found", 404);
    }

    if (productData.status !== "active") {
      throw new AppError("MSG3: Product is inactive", 400);
    }

    let supplierData: {
      supplier_id: string;
      name: string;
      address: string;
      certificate: string | null;
    } | null = null;

    try {
      supplierData = await this.repository.findSupplierById(batchData.supplier_id);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load supplier", 500);
    }

    if (!supplierData) {
      throw new AppError("Supplier not found", 404);
    }

    return {
      product_name: productData.name,
      supplier_name: supplierData.name,
      production_location: supplierData.address,
      harvest_date: batchData.harvest_date,
      expire_date: batchData.expire_date,
      certification: supplierData.certificate,
      batch_number: batchData.batch_id,
    };
  }

  async getOriginByQr(rawQr: string): Promise<ProductOriginInfo> {
    const qrPayload = createQrParseStrategy().parse(rawQr);

    let batchData: {
      batch_id: string;
      product_id: string;
      supplier_id: string;
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

    return this.toOriginInfoFromBatch(batch);
  }

  async getOriginByBatchId(rawBatchId: string): Promise<ProductOriginInfo> {
    const batchId = rawBatchId.trim();
    if (!batchId) {
      throw new AppError("batchId is required", 400);
    }

    let batchData: {
      batch_id: string;
      product_id: string;
      supplier_id: string;
      harvest_date: string;
      expire_date: string;
    } | null = null;
    try {
      batchData = await this.repository.findBatchById(batchId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load batch", 500);
    }

    if (!batchData) {
      throw new AppError("MSG2: Batch not found", 404);
    }

    return this.toOriginInfoFromBatch(batchData);
  }
}
