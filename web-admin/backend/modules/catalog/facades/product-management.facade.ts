import { CategoryManagementRepository } from "../category-management.repository";
import { ProductManagementRepository } from "../product-management.repository";
import { ProductManagementService } from "../product-management.service";
import { ProductManagementAuditObserver, ProductManagementSubject } from "../observers/product-management.observer";
import { CreateProductInput, ProductRow, ProductStatus, UpdateProductInput } from "../product-management.types";

export class ProductManagementFacade {
  private readonly repository = new ProductManagementRepository();
  private readonly categoryRepository = new CategoryManagementRepository();
  private readonly service = new ProductManagementService(this.repository, this.categoryRepository);
  private readonly subject = new ProductManagementSubject();

  constructor() {
    this.subject.attach(new ProductManagementAuditObserver());
  }

  async listProducts(): Promise<ProductRow[]> {
    return this.service.listProducts();
  }

  async createProduct(input: CreateProductInput): Promise<ProductRow> {
    const created = await this.service.createProduct(input);
    await this.subject.notify({ type: "product_created", productId: created.product_id, actor: "admin" });
    return created;
  }

  async updateProduct(input: UpdateProductInput): Promise<ProductRow> {
    const updated = await this.service.updateProduct(input);
    await this.subject.notify({ type: "product_updated", productId: updated.product_id, actor: "admin" });
    return updated;
  }

  async changeStatus(productId: string, status: ProductStatus): Promise<ProductRow> {
    const updated = await this.service.changeStatus(productId, status);
    await this.subject.notify({ type: "product_status_changed", productId, actor: "admin", status: updated.status });
    return updated;
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.service.deleteProduct(productId);
    await this.subject.notify({ type: "product_deleted", productId, actor: "admin" });
  }
}

export const productManagementFacade = new ProductManagementFacade();
