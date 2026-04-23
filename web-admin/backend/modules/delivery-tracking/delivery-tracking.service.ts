import { AppError } from "../../core/errors";
import { DeliveryTrackingRepository } from "./delivery-tracking.repository";
import {
  DeliveryStatus,
  DeliveryTrackingDetailRow,
  DeliveryTrackingRow,
  DeliveryTrackingFilterInput,
  UpdateDeliveryStatusInput,
} from "./delivery-tracking.types";
import { createDeliveryStatusState } from "./states/delivery-status.state";
import { DefaultDeliveryStatusStrategy } from "./strategies/delivery-status.strategy";

export class DeliveryTrackingService {
  private readonly statusStrategy = new DefaultDeliveryStatusStrategy();

  constructor(private readonly repository: DeliveryTrackingRepository) {}

  async listDeliveries(filters: DeliveryTrackingFilterInput): Promise<DeliveryTrackingRow[]> {
    const normalizedStatus = typeof filters.status === "string" && filters.status.trim()
      ? this.statusStrategy.normalizeStatus(filters.status)
      : undefined;

    const fromDate = this.normalizeDate(filters.fromDate);
    const toDate = this.normalizeDate(filters.toDate);

    if (fromDate && toDate && fromDate > toDate) {
      throw new AppError("fromDate must be before or equal to toDate", 400);
    }

    const rows = await this.repository.listTrackingRows();
    return rows.filter((row) => {
      if (normalizedStatus && row.latest_status !== normalizedStatus) {
        return false;
      }

      if (fromDate && (!row.latest_tracking_at || row.latest_tracking_at.slice(0, 10) < fromDate)) {
        return false;
      }

      if (toDate && (!row.latest_tracking_at || row.latest_tracking_at.slice(0, 10) > toDate)) {
        return false;
      }

      return true;
    });
  }

  async getDeliveryDetail(orderId: string): Promise<DeliveryTrackingDetailRow> {
    const normalizedOrderId = orderId.trim();
    if (!normalizedOrderId) {
      throw new AppError("orderId is required", 400);
    }

    const rows = await this.repository.listTrackingRows();
    const summary = rows.find((row) => row.order_id === normalizedOrderId);
    if (!summary) {
      throw new AppError("delivery tracking not found", 404);
    }

    const history = await this.repository.listTrackingHistoryByOrderId(normalizedOrderId);
    return {
      ...summary,
      history,
    };
  }

  async updateDeliveryStatus(input: UpdateDeliveryStatusInput): Promise<DeliveryTrackingDetailRow> {
    const normalizedOrderId = input.orderId.trim();
    if (!normalizedOrderId) {
      throw new AppError("orderId is required", 400);
    }

    const nextStatus = this.statusStrategy.normalizeStatus(input.status);
    const existing = await this.getDeliveryDetail(normalizedOrderId).catch(() => null);

    if (existing) {
      const currentStatus: DeliveryStatus = existing.latest_status;
      const state = createDeliveryStatusState(currentStatus);
      if (!state.canTransitionTo(nextStatus)) {
        throw new AppError(`Cannot transition delivery from ${currentStatus} to ${nextStatus}`, 400);
      }
    }

    await this.repository.createTrackingEntry({
      orderId: normalizedOrderId,
      status: nextStatus,
      note: input.note,
    });

    return this.getDeliveryDetail(normalizedOrderId);
  }

  private normalizeDate(value?: string): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }

    const timestamp = Date.parse(`${normalized}T00:00:00.000Z`);
    if (Number.isNaN(timestamp)) {
      throw new AppError("Date filter must use format YYYY-MM-DD", 400);
    }

    return new Date(timestamp).toISOString().slice(0, 10);
  }
}