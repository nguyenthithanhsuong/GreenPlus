import { PaymentStrategy } from "./payment.strategy";

export class MomoStrategy implements PaymentStrategy {
  async processPayment(orderId: string, amount: number): Promise<boolean> {
    console.log(
      `[MoMo] Initializing payment for order ${orderId} with amount ${amount} VND`
    );
    return true;
  }
}
