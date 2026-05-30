import { AppError } from "../../core/errors";
import { StoresManagementRepository } from "./stores-management.repository";
import { CreateStoreInput, StoreRow, StoreStatus, UpdateStoreInput } from "./stores-management.types";

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value === "undefined" || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function trimToUndefined(value: string | null | undefined): string | undefined {
  if (typeof value === "undefined" || value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeOptionalNumber(value: number | string | null | undefined): number | null | undefined {
  if (typeof value === "undefined") {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError("Latitude and longitude must be valid numbers", 400);
  }

  return parsed;
}

function normalizeOptionalTime(value: string | null | undefined, fieldName: string): string | null | undefined {
  if (typeof value === "undefined") {
    return undefined;
  }

  if (value === null || value.trim() === "") {
    return null;
  }

  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) {
    throw new AppError(`${fieldName} must use HH:MM format`, 400);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? "0");

  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new AppError(`${fieldName} is not a valid time`, 400);
  }

  return `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
}

export class StoresManagementService {
  constructor(private readonly repository: StoresManagementRepository) {}

  async listStores(): Promise<StoreRow[]> {
    return this.repository.listStores();
  }

  private ensureRequiredFields(input: { name?: string; address?: string; managerId?: string }): asserts input is {
    name: string;
    address: string;
    managerId: string;
  } {
    if (!input.name || input.name.trim().length === 0) {
      throw new AppError("Store name is required", 400);
    }

    if (!input.address || input.address.trim().length === 0) {
      throw new AppError("Store address is required", 400);
    }

    if (!input.managerId || input.managerId.trim().length === 0) {
      throw new AppError("Manager is required", 400);
    }
  }

  private normalizeInput(input: CreateStoreInput | UpdateStoreInput) {
    return {
      name: trimToUndefined(input.name),
      description: trimToNull(input.description),
      address: trimToUndefined(input.address),
      ward: trimToNull(input.ward),
      district: trimToNull(input.district),
      city: trimToNull(input.city),
      phone: trimToNull(input.phone),
      email: trimToNull(input.email),
      managerId: trimToUndefined(input.managerId),
      status: input.status,
      latitude: normalizeOptionalNumber(input.latitude),
      longitude: normalizeOptionalNumber(input.longitude),
      openingTime: normalizeOptionalTime(input.openingTime, "Opening time"),
      closingTime: normalizeOptionalTime(input.closingTime, "Closing time"),
    };
  }

  async createStore(input: CreateStoreInput): Promise<StoreRow> {
    const normalized = this.normalizeInput(input);
    this.ensureRequiredFields(normalized);

    return this.repository.createStore({
      name: normalized.name.trim(),
      description: normalized.description,
      address: normalized.address.trim(),
      ward: normalized.ward,
      district: normalized.district,
      city: normalized.city,
      phone: normalized.phone,
      email: normalized.email,
      managerId: normalized.managerId.trim(),
      status: normalized.status ?? "active",
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      openingTime: normalized.openingTime,
      closingTime: normalized.closingTime,
    });
  }

  async updateStore(input: UpdateStoreInput): Promise<StoreRow> {
    const existing = await this.repository.findById(input.storeId);
    if (!existing) {
      throw new AppError("Store not found", 404);
    }

    if (typeof input.name !== "undefined" && input.name.trim().length === 0) {
      throw new AppError("Store name cannot be empty", 400);
    }

    if (typeof input.address !== "undefined" && input.address.trim().length === 0) {
      throw new AppError("Store address cannot be empty", 400);
    }

    if (typeof input.managerId !== "undefined" && input.managerId.trim().length === 0) {
      throw new AppError("Manager cannot be empty", 400);
    }

    const normalized = this.normalizeInput(input);

    const updated = await this.repository.updateStore({
      storeId: input.storeId,
      name: normalized.name,
      description: normalized.description,
      address: normalized.address,
      ward: normalized.ward,
      district: normalized.district,
      city: normalized.city,
      phone: normalized.phone,
      email: normalized.email,
      managerId: normalized.managerId,
      status: normalized.status,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      openingTime: normalized.openingTime,
      closingTime: normalized.closingTime,
    });

    if (!updated) {
      throw new AppError("Store not found", 404);
    }

    return updated;
  }

  async deleteStore(storeId: string): Promise<void> {
    const deleted = await this.repository.deleteStore(storeId);
    if (!deleted) {
      throw new AppError("Store not found", 404);
    }
  }

  async changeStatus(storeId: string, status: StoreStatus): Promise<StoreRow> {
    const existing = await this.repository.findById(storeId);
    if (!existing) {
      throw new AppError("Store not found", 404);
    }

    const updated = await this.repository.updateStore({
      storeId,
      status,
    });

    if (!updated) {
      throw new AppError("Store not found", 404);
    }

    return updated;
  }
}