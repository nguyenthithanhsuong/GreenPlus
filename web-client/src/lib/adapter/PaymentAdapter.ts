import {
  SubscriptionResponse,
  GroupPurchaseResponse,
} from "../services/PaymentService";

export interface SubscriptionUIModel {
  id: string;
  status: string;
  frequency: string;
  startDate: Date;
}

export interface GroupPurchaseUIModel {
  id: string;
  status: string;
  joinedAt: Date;
}

class PaymentAdapter {
  static toSubscriptionUIModel(
    response: SubscriptionResponse,
  ): SubscriptionUIModel {
    return {
      id: response.subscription_id,
      status: response.status,
      frequency: response.frequency,
      startDate: new Date(),
    };
  }

  static toGroupPurchaseUIModel(
    response: GroupPurchaseResponse,
  ): GroupPurchaseUIModel {
    return {
      id: response.participation_id,
      status: response.status,
      joinedAt: new Date(),
    };
  }
}

export default PaymentAdapter;
