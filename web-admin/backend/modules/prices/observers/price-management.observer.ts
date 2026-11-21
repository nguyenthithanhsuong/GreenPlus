import { PriceStatus } from "../price-management.types";
import { logger } from "@/lib/logger";

export type PriceManagementEvent =
  | {
      type: "price_created";
      priceId: string;
      actor: "manager";
      status: PriceStatus;
    }
  | {
      type: "price_updated";
      priceId: string;
      actor: "manager";
      status: PriceStatus;
    }
  | {
      type: "price_deleted";
      priceId: string;
      actor: "manager";
    };

export interface PriceManagementObserver {
  update(event: PriceManagementEvent): Promise<void>;
}

export class PriceManagementSubject {
  private readonly observers = new Set<PriceManagementObserver>();

  attach(observer: PriceManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: PriceManagementEvent): Promise<void> {
    await Promise.all(
      Array.from(this.observers).map((observer) => observer.update(event)),
    );
  }
}

export class PriceManagementAuditObserver implements PriceManagementObserver {
  async update(event: PriceManagementEvent): Promise<void> {
    logger.info("Price event", { kind: event.type });
  }
}
