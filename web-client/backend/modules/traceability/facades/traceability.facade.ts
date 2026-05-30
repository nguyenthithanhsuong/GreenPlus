import { ProductOriginInfo, TraceabilityService } from "../traceability.service";

// Facade cho use case quet QR: route chi goi 1 ham de lay thong tin nguon goc.
export class TraceabilityFacade {
  private readonly service = new TraceabilityService();

  async scanProductOrigin(qrCode: string): Promise<ProductOriginInfo> {
    return this.service.getOriginByQr(qrCode);
  }

  async getBatchOrigin(batchId: string): Promise<ProductOriginInfo> {
    return this.service.getOriginByBatchId(batchId);
  }
}

export const traceabilityFacade = new TraceabilityFacade();
