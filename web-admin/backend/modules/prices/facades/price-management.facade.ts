import { PriceManagementRepository } from "../price-management.repository";
import { PriceManagementService } from "../price-management.service";
import {
  PriceManagementAuditObserver,
  PriceManagementSubject,
} from "../observers/price-management.observer";
import { CreatePriceInput, PriceRow, UpdatePriceInput } from "../price-management.types";

export class PriceManagementFacade {
  private readonly repository = new PriceManagementRepository();
  private readonly service = new PriceManagementService(this.repository);
  private readonly subject = new PriceManagementSubject();

  constructor() {
    this.subject.attach(new PriceManagementAuditObserver());
  }

  async listPrices(): Promise<PriceRow[]> {
    return this.service.listPrices();
  }

  async createPrice(input: CreatePriceInput): Promise<PriceRow> {
    const created = await this.service.createPrice(input);
    await this.subject.notify({
      type: "price_created",
      priceId: created.price_id,
      actor: "manager",
    });

    return created;
  }

  async updatePrice(input: UpdatePriceInput): Promise<PriceRow> {
    const updated = await this.service.updatePrice(input);
    await this.subject.notify({
      type: "price_updated",
      priceId: updated.price_id,
      actor: "manager",
    });

    return updated;
  }

  async deletePrice(priceId: string): Promise<void> {
    await this.service.deletePrice(priceId);
    await this.subject.notify({
      type: "price_deleted",
      priceId,
      actor: "manager",
    });
  }
}

export const priceManagementFacade = new PriceManagementFacade();