import { AppError } from "../../core/errors";
import { CategoryManagementRepository } from "./category-management.repository";
import { CategoryRow, CreateCategoryInput, UpdateCategoryInput } from "./category-management.types";
import { createCategoryState } from "./states/category-state";
import { DefaultCategoryNameStrategy } from "./strategies/category-name.strategy";

export class CategoryManagementService {
  private readonly nameStrategy = new DefaultCategoryNameStrategy();

  constructor(private readonly repository: CategoryManagementRepository) {}

  async listCategories(): Promise<CategoryRow[]> {
    return this.repository.listCategories();
  }

  async findById(categoryId: string): Promise<CategoryRow | null> {
    return this.repository.findById(categoryId);
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryRow> {
    const name = this.nameStrategy.normalize(input.name);
    const existing = await this.repository.findByName(name);

    if (existing) {
      throw new AppError("category already exists", 400);
    }

    return this.repository.createCategory({
      name,
      description: input.description?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
    });
  }

  async updateCategory(input: UpdateCategoryInput): Promise<CategoryRow> {
    if (!input.categoryId.trim()) {
      throw new AppError("categoryId is required", 400);
    }

    const current = await this.repository.findById(input.categoryId);
    if (!current) {
      throw new AppError("category not found", 404);
    }

    let normalizedName = current.name;
    if (typeof input.name !== "undefined") {
      normalizedName = this.nameStrategy.normalize(input.name);
      const duplicate = await this.repository.findByName(normalizedName);
      if (duplicate && duplicate.category_id !== input.categoryId) {
        throw new AppError("category already exists", 400);
      }
    }

    const updated = await this.repository.updateCategory({
      categoryId: input.categoryId,
      name: typeof input.name !== "undefined" ? normalizedName : undefined,
      description: input.description,
      imageUrl: input.imageUrl,
    });

    if (!updated) {
      throw new AppError("category not found", 404);
    }

    return updated;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const normalizedCategoryId = categoryId.trim();
    if (!normalizedCategoryId) {
      throw new AppError("categoryId is required", 400);
    }

    const current = await this.repository.findById(normalizedCategoryId);
    if (!current) {
      throw new AppError("category not found", 404);
    }

    const state = createCategoryState(current.product_count);
    if (!state.canDelete()) {
      throw new AppError(`category is in use by ${current.product_count} product(s)`, 400);
    }

    const deleted = await this.repository.deleteCategory(normalizedCategoryId);
    if (!deleted) {
      throw new AppError("category not found", 404);
    }
  }
}
