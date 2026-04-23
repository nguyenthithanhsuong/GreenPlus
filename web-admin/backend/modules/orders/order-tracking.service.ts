import { AppError } from "../../core/errors";
import { OrderTrackingRepository } from "./order-tracking.repository";
import {
  OrderDetailRow,
  OrderFilterInput,
  OrderListRow,
  OrderStatus,
  UpdateOrderStatusInput,
} from "./order-tracking.types";
import { DefaultOrderStatusStrategy } from "./strategies/order-status.strategy";

export class OrderTrackingService {
  private readonly statusStrategy = new DefaultOrderStatusStrategy();

  constructor(private readonly repository: OrderTrackingRepository) {}

  async listOrders(filters: OrderFilterInput): Promise<OrderListRow[]> {
    const normalizedStatus = typeof filters.status === "string" && filters.status.trim()
      ? this.statusStrategy.normalizeStatus(filters.status)
      : undefined;

    const fromDate = this.normalizeDate(filters.fromDate);
    const toDate = this.normalizeDate(filters.toDate);

    if (fromDate && toDate && fromDate > toDate) {
      throw new AppError("fromDate must be before or equal to toDate", 400);
    }

    return this.repository.listOrders({
      status: normalizedStatus,
      fromDate,
      toDate,
    });
  }

  async getOrderDetail(orderId: string): Promise<OrderDetailRow> {
    const normalizedId = orderId.trim();
    if (!normalizedId) {
      throw new AppError("orderId is required", 400);
    }

    const order = await this.repository.findOrderById(normalizedId);
    if (!order) {
      throw new AppError("order not found", 404);
    }

    return order;
  }

  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<OrderDetailRow> {
    const normalizedOrderId = input.orderId.trim();
    if (!normalizedOrderId) {
      throw new AppError("orderId is required", 400);
    }

    const nextStatus = this.statusStrategy.normalizeStatus(input.status);
    const existing = await this.repository.findOrderById(normalizedOrderId);
    if (!existing) {
      throw new AppError("order not found", 404);
    }

    const currentStatus: OrderStatus = existing.status;
    if (!this.statusStrategy.canTransition(currentStatus, nextStatus)) {
      throw new AppError(`Cannot transition order from ${currentStatus} to ${nextStatus}`, 400);
    }

    const updated = await this.repository.updateOrderStatus({
      orderId: normalizedOrderId,
      status: nextStatus,
    });

    if (!updated) {
      throw new AppError("order not found", 404);
    }

    await this.repository.appendTracking({
      orderId: normalizedOrderId,
      status: nextStatus,
      note: input.note,
    });

    return updated;
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