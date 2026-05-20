import { ProductOriginInfo, TraceabilityService } from "../traceability.service";

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
