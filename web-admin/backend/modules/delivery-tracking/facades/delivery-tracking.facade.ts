import { DeliveryTrackingRepository } from "../delivery-tracking.repository";
import { DeliveryTrackingService } from "../delivery-tracking.service";
import {
  DeliveryTrackingAuditObserver,
  DeliveryTrackingSubject,
} from "../observers/delivery-tracking.observer";
import {
  AssignShipperInput,
  DeliveryShipperOption,
  DeliveryTrackingDetailRow,
  DeliveryTrackingFilterInput,
  DeliveryTrackingRow,
  UpdateDeliveryStatusInput,
} from "../delivery-tracking.types";

export class DeliveryTrackingFacade {
  private readonly repository = new DeliveryTrackingRepository();
  private readonly service = new DeliveryTrackingService(this.repository);
  private readonly subject = new DeliveryTrackingSubject();

  constructor() {
    this.subject.attach(new DeliveryTrackingAuditObserver());
  }

  async listDeliveries(filters: DeliveryTrackingFilterInput): Promise<DeliveryTrackingRow[]> {
    return this.service.listDeliveries(filters);
  }

  async listShippers(): Promise<DeliveryShipperOption[]> {
    return this.service.listShippers();
  }

  async getDeliveryDetail(orderId: string): Promise<DeliveryTrackingDetailRow> {
    const detail = await this.service.getDeliveryDetail(orderId);
    await this.subject.notify({
      type: "delivery_detail_viewed",
      orderId: detail.order_id,
      actor: "manager",
    });

    return detail;
  }

  async assignShipper(input: AssignShipperInput): Promise<DeliveryTrackingDetailRow> {
    const detail = await this.service.assignShipper(input);
    await this.subject.notify({
      type: "shipper_assigned",
      orderId: detail.order_id,
      actor: "manager",
      employeeId: detail.employee_id,
    });

    return detail;
  }

  async updateDeliveryStatus(input: UpdateDeliveryStatusInput): Promise<DeliveryTrackingDetailRow> {
    const previous = await this.service.getDeliveryDetail(input.orderId).catch(() => null);
    const updated = await this.service.updateDeliveryStatus(input);

    await this.subject.notify({
      type: "delivery_status_updated",
      orderId: updated.order_id,
      actor: "manager",
      from: previous?.status ?? "assigned",
      to: updated.status,
    });

    return updated;
  }
}

export const deliveryTrackingFacade = new DeliveryTrackingFacade();