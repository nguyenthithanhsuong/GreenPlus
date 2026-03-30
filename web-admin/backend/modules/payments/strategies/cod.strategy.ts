import { PaymentStrategy } from "./payment.strategy";

export class CodStrategy implements PaymentStrategy {
  async processPayment(orderId: string, amount: number): Promise<boolean> {
    console.log(
      `[COD] Order ${orderId} selected cash on delivery. Recording request.`
    );
    return true;
  }
}
