import { AppError } from "../../core/errors";

export type ParsedQrPayload = {
  productId: string;
  batchId: string;
};

export interface QrParseStrategy {
  parse(rawQr: string): ParsedQrPayload;
}

class QueryStringQrParseStrategy implements QrParseStrategy {
  parse(rawQr: string): ParsedQrPayload {
    const normalized = rawQr.replace(/;/g, "&").trim();
    const params = new URLSearchParams(normalized);
    const productId = params.get("product_id")?.trim() ?? "";
    const batchId = params.get("batch_id")?.trim() ?? "";

    if (!productId || !batchId) {
      throw new AppError("MSG1: QR code must contain product_id and batch_id", 400);
    }

    return { productId, batchId };
  }
}

export function createQrParseStrategy(): QrParseStrategy {
  return new QueryStringQrParseStrategy();
}
