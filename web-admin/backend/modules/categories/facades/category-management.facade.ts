import { CategoryManagementRepository } from "../category-management.repository";
import { CategoryManagementService } from "../category-management.service";
import { CategoryRow, CreateCategoryInput, UpdateCategoryInput } from "../category-management.types";
import { CategoryManagementAuditObserver, CategoryManagementSubject } from "../observers/category-management.observer";

export class CategoryManagementFacade {
  private readonly repository = new CategoryManagementRepository();
  private readonly service = new CategoryManagementService(this.repository);
  private readonly subject = new CategoryManagementSubject();

  constructor() {
    this.subject.attach(new CategoryManagementAuditObserver());
  }

  async listCategories(): Promise<CategoryRow[]> {
    return this.service.listCategories();
  }

  async findById(categoryId: string): Promise<CategoryRow | null> {
    return this.service.findById(categoryId);
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryRow> {
    const created = await this.service.createCategory(input);
    await this.subject.notify({ type: "category_created", categoryId: created.category_id, actor: "admin" });
    return created;
  }

  async updateCategory(input: UpdateCategoryInput): Promise<CategoryRow> {
    const updated = await this.service.updateCategory(input);
    await this.subject.notify({ type: "category_updated", categoryId: updated.category_id, actor: "admin" });
    return updated;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.service.deleteCategory(categoryId);
    await this.subject.notify({ type: "category_deleted", categoryId, actor: "admin" });
  }
}

export const categoryManagementFacade = new CategoryManagementFacade();
