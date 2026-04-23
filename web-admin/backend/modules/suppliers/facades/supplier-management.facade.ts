import { SupplierManagementRepository } from "../supplier-management.repository";
import { SupplierManagementService } from "../supplier-management.service";
import {
  SupplierManagementAuditObserver,
  SupplierManagementSubject,
} from "../observers/supplier-management.observer";
import { CreateSupplierInput, SupplierRow, SupplierStatus, UpdateSupplierInput } from "../supplier-management.types";

export class SupplierManagementFacade {
  private readonly repository = new SupplierManagementRepository();
  private readonly service = new SupplierManagementService(this.repository);
  private readonly subject = new SupplierManagementSubject();

  constructor() {
    this.subject.attach(new SupplierManagementAuditObserver());
  }

  async listSuppliers(): Promise<SupplierRow[]> {
    return this.service.listSuppliers();
  }

  async createSupplier(input: CreateSupplierInput): Promise<SupplierRow> {
    const created = await this.service.createSupplier(input);
    await this.subject.notify({ type: "supplier_created", supplierId: created.supplier_id, actor: "admin" });
    return created;
  }

  async updateSupplier(input: UpdateSupplierInput): Promise<SupplierRow> {
    const updated = await this.service.updateSupplier(input);
    await this.subject.notify({ type: "supplier_updated", supplierId: updated.supplier_id, actor: "admin" });
    return updated;
  }

  async changeStatus(supplierId: string, status: SupplierStatus): Promise<SupplierRow> {
    const updated = await this.service.changeStatus(supplierId, status);
    await this.subject.notify({
      type: "supplier_status_changed",
      supplierId: updated.supplier_id,
      actor: "admin",
      status: updated.status,
    });
    return updated;
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    await this.service.deleteSupplier(supplierId);
    await this.subject.notify({ type: "supplier_deleted", supplierId, actor: "admin" });
  }
}

export const supplierManagementFacade = new SupplierManagementFacade();
