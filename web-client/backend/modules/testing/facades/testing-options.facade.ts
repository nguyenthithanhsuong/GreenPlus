import {
  BatchOption,
  ProductOption,
  TestingOptionsRepository,
  UserOption,
} from "../testing-options.repository";

export type BackendTestingOptions = {
  users: UserOption[];
  products: ProductOption[];
  batches: BatchOption[];
};

// Facade cho backend testing: gom options can thiet de render dropdown ID.
export class TestingOptionsFacade {
  private readonly repository = new TestingOptionsRepository();

  async getAllOptions(): Promise<BackendTestingOptions> {
    const [users, products, batches] = await Promise.all([
      this.repository.listUsers(),
      this.repository.listProducts(),
      this.repository.listBatches(),
    ]);

    return { users, products, batches };
  }
}

export const testingOptionsFacade = new TestingOptionsFacade();
