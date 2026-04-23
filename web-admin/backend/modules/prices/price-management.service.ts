import { AppError } from "../../core/errors";
import { PriceManagementRepository } from "./price-management.repository";
import { CreatePriceInput, PriceRow, UpdatePriceInput } from "./price-management.types";
import { createPriceState } from "./states/price-state";
import { DefaultPriceValidationStrategy } from "./strategies/price-validation.strategy";

export class PriceManagementService {
  private readonly validationStrategy = new DefaultPriceValidationStrategy();

  constructor(private readonly repository: PriceManagementRepository) {}

  async listPrices(): Promise<PriceRow[]> {
    return this.repository.listPrices();
  }

  async createPrice(input: CreatePriceInput): Promise<PriceRow> {
    const date = this.validationStrategy.normalizeDate(input.date);
    const price = this.validationStrategy.normalizePrice(input.price);
    const batchId = this.normalizeBatchId(input.batchId);

    return this.repository.createPrice({
      batchId,
      price,
      date,
    });
  }

  async updatePrice(input: UpdatePriceInput): Promise<PriceRow> {
    const priceId = input.priceId.trim();
    if (!priceId) {
      throw new AppError("priceId is required", 400);
    }

    if (
      typeof input.batchId === "undefined" &&
      typeof input.price === "undefined" &&
      typeof input.date === "undefined"
    ) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    const existing = await this.repository.findPriceById(priceId);
    if (!existing) {
      throw new AppError("price not found", 404);
    }

    const updated = await this.repository.updatePrice({
      priceId,
      batchId: typeof input.batchId !== "undefined" ? this.normalizeBatchId(input.batchId) : undefined,
      price: typeof input.price === "number" ? this.validationStrategy.normalizePrice(input.price) : undefined,
      date: typeof input.date === "string" ? this.validationStrategy.normalizeDate(input.date) : undefined,
    });

    if (!updated) {
      throw new AppError("price not found", 404);
    }

    return updated;
  }

  async deletePrice(priceId: string): Promise<void> {
    const normalizedId = priceId.trim();
    if (!normalizedId) {
      throw new AppError("priceId is required", 400);
    }

    const existing = await this.repository.findPriceById(normalizedId);
    if (!existing) {
      throw new AppError("price not found", 404);
    }

    const state = createPriceState(existing.date);
    if (!state.canDelete()) {
      throw new AppError("Only future price entries can be deleted", 400);
    }

    const deleted = await this.repository.deletePrice(normalizedId);
    if (!deleted) {
      throw new AppError("price not found", 404);
    }
  }

  private normalizeBatchId(batchId?: string | null): string | null {
    if (typeof batchId === "undefined" || batchId === null) {
      return null;
    }

    const normalized = batchId.trim();
    return normalized || null;
  }
}