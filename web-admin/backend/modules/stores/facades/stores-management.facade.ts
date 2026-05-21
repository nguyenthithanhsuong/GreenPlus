import { StoresManagementRepository } from "../stores-management.repository";
import { StoresManagementService } from "../stores-management.service";
import { CreateStoreInput, StoreRow, StoreStatus, UpdateStoreInput } from "../stores-management.types";

export class StoresManagementFacade {
  private readonly repository = new StoresManagementRepository();
  private readonly service = new StoresManagementService(this.repository);

  async listStores(): Promise<StoreRow[]> {
    return this.service.listStores();
  }

  async createStore(input: CreateStoreInput): Promise<StoreRow> {
    return this.service.createStore(input);
  }

  async updateStore(input: UpdateStoreInput): Promise<StoreRow> {
    return this.service.updateStore(input);
  }

  async changeStatus(storeId: string, status: StoreStatus): Promise<StoreRow> {
    return this.service.changeStatus(storeId, status);
  }

  async deleteStore(storeId: string): Promise<void> {
    await this.service.deleteStore(storeId);
  }
}

export const storesManagementFacade = new StoresManagementFacade();