import { AppError } from "../../core/errors";
import { DeliveryTrackingRepository } from "./delivery-tracking.repository";
import {
  AssignShipperInput,
  DeliveryShipperOption,
  DeliveryStatus,
  DeliveryTrackingDetailRow,
  DeliveryTrackingFilterInput,
  DeliveryTrackingRow,
  UpdateDeliveryStatusInput,
} from "./delivery-tracking.types";
import { createDeliveryStatusState } from "./states/delivery-status.state";
import { DefaultDeliveryStatusStrategy } from "./strategies/delivery-status.strategy";

export class DeliveryTrackingService {
  private readonly statusStrategy = new DefaultDeliveryStatusStrategy();

  constructor(private readonly repository: DeliveryTrackingRepository) {}

  async listDeliveries(filters: DeliveryTrackingFilterInput = {}): Promise<DeliveryTrackingRow[]> {
    const normalizedFromDate = this.normalizeDate(filters.fromDate);
    const normalizedToDate = this.normalizeDate(filters.toDate);

    if (normalizedFromDate && normalizedToDate && normalizedFromDate > normalizedToDate) {
      throw new AppError("fromDate must be before or equal to toDate", 400);
    }

    return this.repository.listDeliveries({
      ...filters,
      fromDate: normalizedFromDate,
      toDate: normalizedToDate,
    });
  }

  async getDeliveryDetail(orderId: string): Promise<DeliveryTrackingDetailRow> {
    const normalizedOrderId = orderId.trim();
    if (!normalizedOrderId) {
      throw new AppError("orderId is required", 400);
    }

    const delivery = await this.repository.getDeliveryByOrderId(normalizedOrderId);
    if (!delivery) {
      throw new AppError("delivery not found", 404);
    }

    return delivery;
  }

  async listShippers(): Promise<DeliveryShipperOption[]> {
    return this.repository.listShippers();
  }

  async assignShipper(input: AssignShipperInput): Promise<DeliveryTrackingDetailRow> {
    const orderId = input.orderId.trim();
    if (!orderId) {
      throw new AppError("orderId is required", 400);
    }

    const employeeId = input.employeeId.trim();
    if (!employeeId) {
      throw new AppError("employeeId is required", 400);
    }

    await this.requireShipper(employeeId);

    const existing = await this.repository.getDeliveryByOrderId(orderId);
    if (existing) {
      await this.repository.updateDeliveryAssignment({
        orderId,
        employeeId,
        note: input.note,
      });

      return this.getDeliveryDetail(orderId);
    }

    await this.repository.createDelivery({
      orderId,
      employeeId,
      status: "assigned",
      note: input.note,
    });

    return this.getDeliveryDetail(orderId);
  }

  async updateDeliveryStatus(input: UpdateDeliveryStatusInput): Promise<DeliveryTrackingDetailRow> {
    const orderId = input.orderId.trim();
    if (!orderId) {
      throw new AppError("orderId is required", 400);
    }

    const existing = await this.repository.getDeliveryByOrderId(orderId);
    if (!existing) {
      throw new AppError("delivery not found", 404);
    }

    const employeeId = input.employeeId?.trim();
    if (employeeId) {
      await this.requireShipper(employeeId);
    }

    const nextStatus = this.statusStrategy.normalizeStatus(input.status);
    const currentStatus: DeliveryStatus = existing.status;

    const state = createDeliveryStatusState(currentStatus);
    if (!state.canTransitionTo(nextStatus)) {
      throw new AppError(`Cannot transition delivery from ${currentStatus} to ${nextStatus}`, 400);
    }

    await this.repository.updateDeliveryStatus({
      deliveryId: existing.delivery_id,
      status: nextStatus,
      employeeId,
      note: input.note ?? existing.note ?? undefined,
    });

    return this.getDeliveryDetail(orderId);
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

  private async requireShipper(employeeId: string): Promise<void> {
    const shipper = await this.repository.findShipperById(employeeId);
    if (!shipper) {
      throw new AppError("employeeId must belong to a shipper user", 400);
    }
  }
}