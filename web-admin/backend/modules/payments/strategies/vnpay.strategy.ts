import { PaymentStrategy } from "./payment.strategy";

export class VNPayStrategy implements PaymentStrategy {
  async processPayment(orderId: string, amount: number): Promise<boolean> {
    console.log(
      `[VNPay] Redirecting payment for order ${orderId} with amount ${amount} VND`
    );
    return true;
  }
}
