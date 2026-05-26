import type { GroupPurchaseResponse, SubscriptionResponse } from "../singleton";

export interface SubscriptionUIModel {
  id: string;
  status: string;
  statusLabel: string;
  frequency: string;
  frequencyLabel: string;
}

export interface GroupPurchaseUIModel {
  id: string;
  status: string;
  statusLabel: string;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Hàng tuần",
  biweekly: "Hai tuần một lần",
  monthly: "Hàng tháng",
};

const statusLabels: Record<string, string> = {
  active: "Đang hoạt động",
  pending: "Đang xử lý",
  confirmed: "Đã xác nhận",
  open: "Đang mở",
  joined: "Đã tham gia",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

export class PaymentMapper {
  static toSubscriptionUIModel(
    response: SubscriptionResponse,
  ): SubscriptionUIModel {
    return {
      id: response.subscription_id,
      status: response.status,
      statusLabel: statusLabels[response.status] ?? response.status,
      frequency: response.frequency,
      frequencyLabel: frequencyLabels[response.frequency] ?? response.frequency,
    };
  }

  static toGroupPurchaseUIModel(
    response: GroupPurchaseResponse,
  ): GroupPurchaseUIModel {
    return {
      id: response.participation_id,
      status: response.status,
      statusLabel: statusLabels[response.status] ?? response.status,
    };
  }
}
