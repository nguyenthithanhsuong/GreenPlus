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

export class CODStrategy implements PaymentStrategy {
  private method: PaymentMethod = {
    id: "cod",
    name: "Cash on Delivery",
    displayName: "COD - Thu tiền khi giao",
    description: "Thanh toán khi nhận hàng",
    icon: "💵",
    isAvailable: true,
  };

  async validate(context: PaymentContext): Promise<boolean> {
    return context.amount > 0 && !!context.orderId;
  }

  async process(context: PaymentContext): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `COD-${context.orderId}-${Date.now()}`,
      message: "Đơn hàng đã được tạo. Vui lòng thanh toán khi nhận hàng.",
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
    icon: "📱",
    isAvailable: true,
  };

  async validate(context: PaymentContext): Promise<boolean> {
    return context.amount > 0 && !!context.orderId;
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
    // Integrate with MoMo API to cancel
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
    description: "Thanh toán qua cổng VNPay",
    icon: "💳",
    isAvailable: true,
  };

  async validate(context: PaymentContext): Promise<boolean> {
    return context.amount > 0 && !!context.orderId && !!context.customerEmail;
  }

  async process(context: PaymentContext): Promise<PaymentResult> {
    // In real implementation, integrate with VNPay API
    const transactionId = `VNPAY-${context.orderId}-${Date.now()}`;
    return {
      success: true,
      transactionId,
      message: "Vui lòng hoàn thành thanh toán trên cổng VNPay",
      redirectUrl: `https://sandbox.vnpayment.vn/paygate?vnp_TxnRef=${transactionId}`,
    };
  }

  async cancel(transactionId: string): Promise<boolean> {
    // Integrate with VNPay API to cancel
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

  static registerStrategy(methodId: string, strategy: PaymentStrategy): void {
    this.strategies.set(methodId, strategy);
  }

  static getAllMethods(): PaymentMethod[] {
    return Array.from(this.strategies.values()).map((s) => s.getMethod());
  }

  static getAvailableMethods(): PaymentMethod[] {
    return this.getAllMethods().filter((m) => m.isAvailable);
  }
}
