import apiService from "./ApiService";

export interface CreateOrderResponse {
  order_id: string;
  status: "pending";
  total_amount: number;
}

class OrderService {
  private static instance: OrderService;

  private constructor() {}

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  async createOrder(params: {
    userId: string;
    deliveryAddress: string;
    deliveryFee: number;
    note: string;
    paymentMethod: "cod" | "momo" | "vnpay" | "bank_transfer";
  }): Promise<CreateOrderResponse> {
    return apiService.post<CreateOrderResponse>("/api/orders", params);
  }
}

export default OrderService.getInstance();
