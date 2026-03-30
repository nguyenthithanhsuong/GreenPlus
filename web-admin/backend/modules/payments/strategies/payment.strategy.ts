export interface PaymentStrategy {
  processPayment(orderId: string, amount: number): Promise<boolean>;
}

export type PaymentMethod = "momo" | "vnpay" | "cod";
