import { PaymentStrategy } from "./payment.strategy";

export class MomoStrategy implements PaymentStrategy {
  async processPayment(orderId: string, amount: number): Promise<boolean> {
    // Placeholder adapter: no provider verification or persisted payment occurred.
    void orderId; void amount;
    return false;
  }
}
