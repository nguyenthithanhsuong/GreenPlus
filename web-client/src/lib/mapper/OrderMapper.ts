import type { CreateOrderResponse } from "../singleton";

export interface OrderUIModel {
  id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total: number;
  createdAt: Date;
}

export class OrderMapper {
  static toUIModel(response: CreateOrderResponse): OrderUIModel {
    return {
      id: response.order_id,
      status: response.status,
      total: response.total_amount,
      createdAt: new Date(),
    };
  }
}
