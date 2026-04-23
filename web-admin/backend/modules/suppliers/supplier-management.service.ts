import { AppError } from "../../core/errors";
import { CreateSupplierInput, SupplierRow, SupplierStatus, UpdateSupplierInput } from "./supplier-management.types";
import { SupplierManagementRepository } from "./supplier-management.repository";
import { DefaultSupplierStatusStrategy } from "./strategies/supplier-status.strategy";

export class SupplierManagementService {
  private readonly statusStrategy = new DefaultSupplierStatusStrategy();

  constructor(private readonly repository: SupplierManagementRepository) {}

  async listSuppliers(): Promise<SupplierRow[]> {
    return this.repository.listSuppliers();
  }

  private ensureRequiredFields(input: { name?: string; address?: string }): asserts input is { name: string; address: string } {
    if (!input.name || input.name.trim().length === 0) {
      throw new AppError("Supplier name is required", 400);
    }

    if (!input.address || input.address.trim().length === 0) {
      throw new AppError("Supplier address is required", 400);
    }
  }

  async createSupplier(input: CreateSupplierInput): Promise<SupplierRow> {
    this.ensureRequiredFields(input);

    return this.repository.createSupplier({
      name: input.name.trim(),
      address: input.address.trim(),
      certificate: input.certificate?.trim() || null,
      description: input.description?.trim() || null,
      status: this.statusStrategy.normalize(input.status),
    });
  }

  async updateSupplier(input: UpdateSupplierInput): Promise<SupplierRow> {
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new AppError("Supplier name cannot be empty", 400);
    }

    if (input.address !== undefined && input.address.trim().length === 0) {
      throw new AppError("Supplier address cannot be empty", 400);
    }

    const existing = await this.repository.findById(input.supplierId);
    if (!existing) {
      throw new AppError("Supplier not found", 404);
    }

    const nextStatus = typeof input.status !== "undefined"
      ? this.statusStrategy.transition(existing.status, input.status)
      : existing.status;

    const updated = await this.repository.updateSupplier({
      supplierId: input.supplierId,
      name: input.name,
      address: input.address,
      certificate: input.certificate,
      description: input.description,
      status: nextStatus,
    });

    if (!updated) {
      throw new AppError("Supplier not found", 404);
    }

    return updated;
  }

  async changeStatus(supplierId: string, status: SupplierStatus): Promise<SupplierRow> {
    const existing = await this.repository.findById(supplierId);
    if (!existing) {
      throw new AppError("Supplier not found", 404);
    }

    const nextStatus = this.statusStrategy.transition(existing.status, status);
    const updated = await this.repository.updateSupplier({ supplierId, status: nextStatus });

    if (!updated) {
      throw new AppError("Supplier not found", 404);
    }

    return updated;
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    const deleted = await this.repository.deleteSupplier(supplierId);
    if (!deleted) {
      throw new AppError("Supplier not found", 404);
    }
  }
}
