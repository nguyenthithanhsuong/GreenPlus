export class InventoryService {
  async getStock(productId: string): Promise<number> {
    if (!productId) return 0;
    return 0;
  }
}
