export class BatchService {
  async listBatches(productId: string): Promise<Array<{ id: string; productId: string }>> {
    if (!productId) return [];
    return [];
  }
}
