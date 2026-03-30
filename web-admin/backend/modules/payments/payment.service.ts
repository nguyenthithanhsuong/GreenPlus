import { CodStrategy } from "./strategies/cod.strategy";
import { MomoStrategy } from "./strategies/momo.strategy";
import { PaymentMethod, PaymentStrategy } from "./strategies/payment.strategy";
import { VNPayStrategy } from "./strategies/vnpay.strategy";

export type HandleOrderPaymentInput = {
  orderId: string;
  amount: number;
  method: PaymentMethod;
};

export type HandleOrderPaymentResult = {
  success: boolean;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  message: string;
};

class PaymentContext {
  constructor(private strategy: PaymentStrategy) {}

  setStrategy(strategy: PaymentStrategy): void {
    this.strategy = strategy;
  }

  async executePayment(orderId: string, amount: number): Promise<boolean> {
    return this.strategy.processPayment(orderId, amount);
  }
}

function createPaymentStrategy(method: PaymentMethod): PaymentStrategy {
  switch (method) {
    case "momo":
      return new MomoStrategy();
    case "vnpay":
      return new VNPayStrategy();
    case "cod":
      return new CodStrategy();
    default:
      throw new Error("Unsupported payment method");
  }
}

export async function handleOrderPayment(
  input: HandleOrderPaymentInput
): Promise<HandleOrderPaymentResult> {
  const strategy = createPaymentStrategy(input.method);
  const paymentContext = new PaymentContext(strategy);

  const isSuccess = await paymentContext.executePayment(input.orderId, input.amount);

  if (!isSuccess) {
    return {
      success: false,
      orderId: input.orderId,
      amount: input.amount,
      method: input.method,
      message: "Payment failed",
    };
  }

  return {
    success: true,
    orderId: input.orderId,
    amount: input.amount,
    method: input.method,
    message: "Payment processed successfully",
  };
}
