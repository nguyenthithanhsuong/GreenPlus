import { AppError } from "../../core/errors";
import { CategoryManagementRepository } from "./category-management.repository";
import { ProductManagementRepository } from "./product-management.repository";
import { CreateProductInput, ProductRow, ProductStatus, UpdateProductInput } from "./product-management.types";
import { DefaultProductStatusStrategy } from "./strategies/product-status.strategy";

export class ProductManagementService {
  private readonly statusStrategy = new DefaultProductStatusStrategy();

  constructor(
    private readonly repository: ProductManagementRepository,
    private readonly categoryRepository: CategoryManagementRepository
  ) {}

  async listProducts(): Promise<ProductRow[]> {
    return this.repository.listProducts();
  }

  async createProduct(input: CreateProductInput): Promise<ProductRow> {
    const name = input.name.trim();
    if (!name) {
      throw new AppError("Product name is required", 400);
    }

    const unit = input.unit.trim();
    if (!unit) {
      throw new AppError("Product unit is required", 400);
    }

    const categoryId = input.categoryId?.trim() || null;
    if (categoryId) {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new AppError("Category not found", 404);
      }
    }

    return this.repository.createProduct({
      categoryId,
      name,
      description: input.description,
      unit,
      imageUrl: input.imageUrl,
      nutrition: input.nutrition,
      status: this.statusStrategy.normalize(input.status),
    });
  }

  async updateProduct(input: UpdateProductInput): Promise<ProductRow> {
    if (!input.productId.trim()) {
      throw new AppError("productId is required", 400);
    }

    const existing = await this.repository.findById(input.productId);
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    if (typeof input.categoryId !== "undefined") {
      const categoryId = input.categoryId?.trim() || null;
      if (categoryId) {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
          throw new AppError("Category not found", 404);
        }
      }
      input.categoryId = categoryId;
    }

    if (typeof input.name !== "undefined" && !input.name.trim()) {
      throw new AppError("Product name is required", 400);
    }

    if (typeof input.unit !== "undefined" && !input.unit.trim()) {
      throw new AppError("Product unit is required", 400);
    }

    return this.repository.updateProduct({
      ...input,
      name: input.name?.trim(),
      unit: input.unit?.trim(),
      status: typeof input.status !== "undefined" ? this.statusStrategy.normalize(input.status) : undefined,
    }) as Promise<ProductRow>;
  }

  async changeStatus(productId: string, status: ProductStatus): Promise<ProductRow> {
    const existing = await this.repository.findById(productId);
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    const nextStatus = this.statusStrategy.normalize(status);
    const allowedStatus = this.statusStrategy.transition(existing.status, nextStatus);

    const updated = await this.repository.updateProduct({
      productId,
      status: allowedStatus,
    });

    if (!updated) {
      throw new AppError("Product not found", 404);
    }

    return updated;
  }

  async deleteProduct(productId: string): Promise<void> {
    if (!productId.trim()) {
      throw new AppError("productId is required", 400);
    }

    const deleted = await this.repository.deleteProduct(productId);
    if (!deleted) {
      throw new AppError("Product not found", 404);
    }
  }
}
