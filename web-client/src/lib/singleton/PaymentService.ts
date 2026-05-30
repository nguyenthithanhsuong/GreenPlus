import apiService from "./ApiService";

export interface SubscriptionResponse {
  subscription_id: string;
  status: string;
  frequency: string;
}

export interface GroupPurchaseResponse {
  participation_id: string;
  status: string;
}

class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createSubscription(params: {
    userId: string;
    productId: string;
    frequency: string;
  }): Promise<SubscriptionResponse> {
    return apiService.post<SubscriptionResponse>("/api/subscriptions", params);
  }

  async joinGroupPurchase(params: {
    userId: string;
    groupId: string;
    quantity: number;
  }): Promise<GroupPurchaseResponse> {
    return apiService.post<GroupPurchaseResponse>(
      "/api/group-purchases",
      params,
    );
  }
}

export default PaymentService.getInstance();
