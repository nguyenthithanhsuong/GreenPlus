export interface PaymentMethod {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  isAvailable: boolean;
}

export interface PaymentContext {
  amount: number;
  currency: string;
  orderId: string;
  userId: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  redirectUrl?: string;
}

export interface PaymentStrategy {
  validate(context: PaymentContext): Promise<boolean>;
  process(context: PaymentContext): Promise<PaymentResult>;
  cancel(transactionId: string): Promise<boolean>;
  getMethod(): PaymentMethod;
}

async function confirmOrderPayment(context: PaymentContext): Promise<PaymentResult> {
  const response = await fetch(
    `/api/orders/${encodeURIComponent(context.orderId)}/confirm-payment`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: context.userId }),
    },
  );

  const payload = (await response.json()) as {
    error?: string;
    message?: string;
    order_id?: string;
    payment_status?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Khong the cap nhat trang thai thanh toan.");
  }

  return {
    success: payload.payment_status === "paid",
    transactionId: payload.order_id,
    message: payload.message ?? "Thanh toan da duoc xac nhan.",
  };
}

export class CODStrategy implements PaymentStrategy {
  private method: PaymentMethod = {
    id: "cod",
    name: "Cash on Delivery",
    displayName: "COD - Thu tiền khi giao",
    description: "Thanh toán khi nhận hàng",
    isAvailable: true,
  };

constructor() {
  console.log("Đã đổi thành strategy COD");
}

  async validate(context: PaymentContext): Promise<boolean> {
    return context.amount > 0 && Boolean(context.orderId) && Boolean(context.userId);
  }

  async process(context: PaymentContext): Promise<PaymentResult> {
  const response = await fetch(
    `/api/orders/${encodeURIComponent(context.orderId)}/confirm-payment`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: context.userId,
        paymentMethod: "cod",
      }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "COD update failed");
  }

  return {
    success: payload.payment_status === "paid" || payload.payment_status === "pending",
    transactionId: `COD-${context.orderId}`,
    message: "COD order confirmed successfully.",
  };
}

  async cancel(transactionId: string): Promise<boolean> {
    void transactionId;
    return true;
  }

  getMethod(): PaymentMethod {
    return this.method;
  }
}

export class MoMoStrategy implements PaymentStrategy {
  private method: PaymentMethod = {
    id: "momo",
    name: "MoMo",
    displayName: "MoMo - Ví điện tử",
    description: "Thanh toán qua ứng dụng MoMo",
    isAvailable: true,
  };

constructor() {
  console.log("Đã đổi thành strategy MoMo");
}

  async validate(context: PaymentContext): Promise<boolean> {
    return context.amount > 0 && Boolean(context.orderId) && Boolean(context.userId);
  }

 async process(context: PaymentContext): Promise<PaymentResult> {
    // In real implementation, integrate with MoMo API
    const transactionId = `MOMO-${context.orderId}-${Date.now()}`;
    return {
      success: true,
      transactionId,
      message: "Vui lòng hoàn thành thanh toán trong ứng dụng MoMo",
      redirectUrl: `https://payment.momo.vn/gateway?transactionId=${transactionId}`,
    };
  }

  async cancel(transactionId: string): Promise<boolean> {
    void transactionId;
    return true;
  }

  getMethod(): PaymentMethod {
    return this.method;
  }
}

export class VNPayStrategy implements PaymentStrategy {
  private method: PaymentMethod = {
    id: "vnpay",
    name: "VNPay",
    displayName: "VNPay - Cổng thanh toán",
    description: "Thanh toán qua công VNPay",
    isAvailable: true,
  };

constructor() {
  console.log("Đã đổi thành strategy VNPay");
}

  async validate(context: PaymentContext): Promise<boolean> {
    return (
      context.amount > 0 &&
      Boolean(context.orderId) &&
      Boolean(context.userId) &&
      Boolean(context.customerEmail)
    );
  }

  async process(context: PaymentContext): Promise<PaymentResult> {
    const transactionId = `VNPAY-${context.orderId}-${Date.now()}`;
    return {
      success: true,
      transactionId,
      message: "Vui lòng hoàn thành thanh toán trên cổng VNPay",
      redirectUrl: `https://sandbox.vnpayment.vn/paygate?vnp_TxnRef=${transactionId}`,
    };
  }

  async cancel(transactionId: string): Promise<boolean> {
    void transactionId;
    return true;
  }

  getMethod(): PaymentMethod {
    return this.method;
  }
}

export class PaymentStrategyRegistry {
  private static strategies = new Map<string, PaymentStrategy>([
    ["cod", new CODStrategy()],
    ["momo", new MoMoStrategy()],
    ["vnpay", new VNPayStrategy()],
  ]);

  static getStrategy(methodId: string): PaymentStrategy {
    const strategy = this.strategies.get(methodId);
    if (!strategy) {
      throw new Error(`Payment strategy for method "${methodId}" not found`);
    }
    return strategy;
  }

  static hasStrategy(methodId: string): boolean {
    return this.strategies.has(methodId);
  }

  static registerStrategy(methodId: string, strategy: PaymentStrategy): void {
    this.strategies.set(methodId, strategy);
  }

  static getAllMethods(): PaymentMethod[] {
    return Array.from(this.strategies.values()).map((strategy) =>
      strategy.getMethod(),
    );
  }

  static getAvailableMethods(): PaymentMethod[] {
    return this.getAllMethods().filter((method) => method.isAvailable);
  }
}
