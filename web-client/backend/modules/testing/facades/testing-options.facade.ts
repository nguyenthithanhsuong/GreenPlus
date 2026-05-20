import {
  BatchOption,
  CategoryOption,
  ProductOption,
  TestingOptionsRepository,
  UserOption,
} from "../testing-options.repository";

export type BackendTestingOptions = {
  users: UserOption[];
  categories: CategoryOption[];
  products: ProductOption[];
  batches: BatchOption[];
};

export class TestingOptionsFacade {
  private readonly repository = new TestingOptionsRepository();

  async getAllOptions(): Promise<BackendTestingOptions> {
    const [users, categories, products, batches] = await Promise.all([
      this.repository.listUsers(),
      this.repository.listCategories(),
      this.repository.listProducts(),
      this.repository.listBatches(),
    ]);

    return { users, categories, products, batches };
  }
}

export const testingOptionsFacade = new TestingOptionsFacade();
