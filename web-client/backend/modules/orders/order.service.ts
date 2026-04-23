import { AppError } from "../../core/errors";
import { readRelationValue, OrderRepository } from "./order.repository";
import { createOrderState } from "./states/order.state";
import { createOrderStatusStrategy } from "./strategies/order-status.strategy";
import {
  CancelOrderInput,
  CreateOrderInput,
  ConfirmPaymentInput,
  OrderDetail,
  OrderItemDetail,
  PaymentMethod,
  OrderStatus,
  OrderSummary,
  PaymentStatus,
  ShippingStatus,
  UpdateOrderInput,
} from "./order.types";

const VALID_PAYMENT_STATUS = new Set<PaymentStatus>(["pending", "paid", "failed", "cancelled", "unknown"]);
const VALID_PAYMENT_METHOD = new Set<PaymentMethod>(["cod", "momo", "vnpay", "bank_transfer"]);
const VALID_SHIPPING_STATUS = new Set<ShippingStatus>([
  "assigned",
  "picked_up",
  "delivering",
  "delivered",
  "unknown",
]);

export class OrderService {
  private readonly repository = new OrderRepository();

  private isLegacyPaymentStatusConstraintError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return /payments_status_check/i.test(error.message);
  }

  private normalizePaymentStatus(value: string | null): PaymentStatus {
    const lower = (value ?? "unknown").toLowerCase() as PaymentStatus;
    return VALID_PAYMENT_STATUS.has(lower) ? lower : "unknown";
  }

  private normalizeShippingStatus(value: string | null): ShippingStatus {
    const lower = (value ?? "unknown").toLowerCase() as ShippingStatus;
    return VALID_SHIPPING_STATUS.has(lower) ? lower : "unknown";
  }

  private normalizePaymentMethod(value: string | null): PaymentMethod | "unknown" {
    const lower = (value ?? "unknown").toLowerCase() as PaymentMethod | "unknown";
    return VALID_PAYMENT_METHOD.has(lower as PaymentMethod) ? (lower as PaymentMethod) : "unknown";
  }

  private mapOrderSummary(statusStrategy: ReturnType<typeof createOrderStatusStrategy>, row: {
    order_id: string;
    order_date: string;
    status: OrderStatus;
    total_amount: number;
    delivery_address: string;
    delivery_fee: number;
    note: string | null;
    created_at: string;
  }): Omit<OrderSummary, "preview_images"> {
    return {
      order_id: row.order_id,
      order_date: row.order_date,
      status: row.status,
      status_label: statusStrategy.toLabel(row.status),
      total_amount: Number(row.total_amount),
      delivery_address: row.delivery_address,
      delivery_fee: Number(row.delivery_fee),
      note: row.note,
      created_at: row.created_at,
    };
  }

  async listMyOrders(userId: string): Promise<OrderSummary[]> {
    if (!userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    const statusStrategy = createOrderStatusStrategy();

    let rows: Awaited<ReturnType<OrderRepository["listOrdersByUser"]>> = [];
    try {
      rows = await this.repository.listOrdersByUser(userId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load orders", 500);
    }

    const orderIds = rows.map((row) => row.order_id);
    let imageRows: Awaited<ReturnType<OrderRepository["listOrderItemImages"]>> = [];
    try {
      imageRows = await this.repository.listOrderItemImages(orderIds);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load order images", 500);
    }

    const imageMap = new Map<string, string[]>();
    imageRows.forEach((row) => {
      const orderId = String(row.order_id);
      const imageUrl = readRelationValue<string>(row.products, "image_url");
      if (!imageUrl) {
        return;
      }

      const current = imageMap.get(orderId) ?? [];
      if (current.length >= 3 || current.includes(imageUrl)) {
        return;
      }

      imageMap.set(orderId, [...current, imageUrl]);
    });

    return rows.map((row) => ({
      ...this.mapOrderSummary(statusStrategy, row),
      preview_images: imageMap.get(row.order_id) ?? [],
    }));
  }

  async getOrderDetail(userId: string, orderId: string): Promise<OrderDetail> {
    if (!userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (!orderId.trim()) {
      throw new AppError("orderId is required", 400);
    }

    const statusStrategy = createOrderStatusStrategy();

    let order: Awaited<ReturnType<OrderRepository["findOrderById"]>> = null;
    try {
      order = await this.repository.findOrderById(orderId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load order", 500);
    }

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.user_id !== userId.trim()) {
      throw new AppError("Access denied for this order", 403);
    }

    let trackingRows: Awaited<ReturnType<OrderRepository["listTracking"]>> = [];
    let itemRows: Awaited<ReturnType<OrderRepository["listOrderItems"]>> = [];
    let paymentStatus: string | null = null;
    let paymentMethod: string | null = null;
    let shippingStatus: string | null = null;

    try {
      [trackingRows, itemRows, shippingStatus] = await Promise.all([
        this.repository.listTracking(order.order_id),
        this.repository.listOrderItems(order.order_id),
        this.repository.findDeliveryStatus(order.order_id),
      ]);

      const paymentInfo = await this.repository.findPaymentInfo(order.order_id);
      paymentStatus = paymentInfo.status;
      paymentMethod = paymentInfo.method;
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load order detail", 500);
    }

    const items: OrderItemDetail[] = itemRows.map((row) => ({
      order_item_id: String(row.order_item_id),
      product_id: String(row.product_id),
      batch_id: String(row.batch_id),
      quantity: Number(row.quantity),
      price: Number(row.price),
      product_name: readRelationValue<string>(row.products, "name"),
      product_image_url: readRelationValue<string>(row.products, "image_url"),
    }));

    const normalizedPaymentStatus = this.normalizePaymentStatus(paymentStatus);
    const effectivePaymentStatus: PaymentStatus =
      order.status === "cancelled" && (normalizedPaymentStatus === "failed" || normalizedPaymentStatus === "pending")
        ? "cancelled"
        : normalizedPaymentStatus;

    return {
      order_id: order.order_id,
      user_id: order.user_id,
      order_date: order.order_date,
      order_status: order.status,
      order_status_label: statusStrategy.toLabel(order.status),
      shipping_status: this.normalizeShippingStatus(shippingStatus),
      payment_status: effectivePaymentStatus,
      payment_method: this.normalizePaymentMethod(paymentMethod),
      tracking_history: trackingRows.map((row) => ({
        tracking_id: String(row.tracking_id),
        status: String(row.status),
        note: row.note,
        created_at: String(row.created_at),
      })),
      items,
      total_amount: Number(order.total_amount),
      delivery_address: order.delivery_address,
      delivery_fee: Number(order.delivery_fee),
      note: order.note,
    };
  }

  private async resolveOrderItemsFromCart(userId: string): Promise<
    Array<{ productId: string; batchId: string; quantity: number; price: number; subtotal: number }>
  > {
    let cart: Awaited<ReturnType<OrderRepository["findCartByUserId"]>> = null;
    try {
      cart = await this.repository.findCartByUserId(userId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load cart", 500);
    }

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    let cartItems: Awaited<ReturnType<OrderRepository["listCartItems"]>> = [];
    try {
      cartItems = await this.repository.listCartItems(cart.cart_id);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load cart items", 500);
    }

    if (cartItems.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const productIds = cartItems.map((item) => item.product_id);

    let priceRows: Awaited<ReturnType<OrderRepository["listLatestPriceRows"]>> = [];
    try {
      priceRows = await this.repository.listLatestPriceRows(productIds);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load latest prices", 500);
    }

    const priceMap = new Map<string, number>();
    priceRows.forEach((row) => {
      if (!priceMap.has(row.product_id)) {
        priceMap.set(row.product_id, Number(row.price));
      }
    });

    const resolved: Array<{ productId: string; batchId: string; quantity: number; price: number; subtotal: number }> = [];

    for (const item of cartItems) {
      const price = priceMap.get(item.product_id);
      if (typeof price !== "number") {
        throw new AppError(`Missing price for product ${item.product_id}`, 400);
      }

      let batchRows: Awaited<ReturnType<OrderRepository["listBatchRows"]>> = [];
      try {
        batchRows = await this.repository.listBatchRows(item.product_id);
      } catch (error) {
        throw new AppError(error instanceof Error ? error.message : "Failed to load product batches", 500);
      }

      const sellableBatch = await this.pickSellableBatch(batchRows, item.quantity);
      if (!sellableBatch) {
        throw new AppError(`Insufficient stock for product ${item.product_id}`, 400);
      }

      resolved.push({
        productId: item.product_id,
        batchId: sellableBatch,
        quantity: item.quantity,
        price,
        subtotal: price * item.quantity,
      });
    }

    return resolved;
  }

  private async pickSellableBatch(
    batchRows: Array<{ batch_id: string; expire_date: string; status: string }>,
    requiredQuantity: number
  ): Promise<string | null> {
    const now = Date.now();

    for (const batch of batchRows) {
      if (batch.status !== "available") {
        continue;
      }

      if (new Date(batch.expire_date).getTime() < now) {
        continue;
      }

      let quantityAvailable = 0;
      try {
        quantityAvailable = await this.repository.getInventoryByBatchId(batch.batch_id);
      } catch (error) {
        throw new AppError(error instanceof Error ? error.message : "Failed to load inventory", 500);
      }

      if (quantityAvailable >= requiredQuantity) {
        return batch.batch_id;
      }
    }

    return null;
  }

  async createOrder(input: CreateOrderInput): Promise<{ order_id: string; status: "pending"; total_amount: number }> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (!input.deliveryAddress.trim()) {
      throw new AppError("deliveryAddress is required", 400);
    }

    const deliveryFee = Number(input.deliveryFee ?? 0);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      throw new AppError("deliveryFee must be >= 0", 400);
    }

    const paymentMethod = (input.paymentMethod ?? "cod").toLowerCase() as PaymentMethod;
    if (!VALID_PAYMENT_METHOD.has(paymentMethod)) {
      throw new AppError("paymentMethod is invalid", 400);
    }

    const resolvedItems = await this.resolveOrderItemsFromCart(input.userId.trim());
    const itemTotal = resolvedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalAmount = itemTotal + deliveryFee;

    let created: { order_id: string };
    let cart: Awaited<ReturnType<OrderRepository["findCartByUserId"]>> = null;

    try {
      created = await this.repository.createOrder({
        userId: input.userId.trim(),
        totalAmount,
        deliveryAddress: input.deliveryAddress.trim(),
        deliveryFee,
        note: (input.note ?? "").trim() || null,
      });

      for (const item of resolvedItems) {
        await this.repository.insertOrderItem({
          orderId: created.order_id,
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
          price: item.price,
        });
      }

      await this.repository.insertTracking({
        orderId: created.order_id,
        status: "pending",
        note: "Đã tạo đơn từ Đơn hàng",
      });

      await this.repository.insertPayment({
        orderId: created.order_id,
        method: paymentMethod,
        status: "pending",
        amount: totalAmount,
      });

      cart = await this.repository.findCartByUserId(input.userId.trim());
      if (cart) {
        await this.repository.clearCart(cart.cart_id);
      }
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to create order", 500);
    }

    return {
      order_id: created.order_id,
      status: "pending",
      total_amount: totalAmount,
    };
  }

  async cancelOrder(input: CancelOrderInput): Promise<{ order_id: string; status: "cancelled"; message: string }> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (!input.orderId.trim()) {
      throw new AppError("orderId is required", 400);
    }

    let order: Awaited<ReturnType<OrderRepository["findOrderById"]>> = null;
    try {
      order = await this.repository.findOrderById(input.orderId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load order", 500);
    }

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.user_id !== input.userId.trim()) {
      throw new AppError("Access denied for this order", 403);
    }

    const state = createOrderState(order.status);
    if (!state.canCancel()) {
      throw new AppError("Cancellation failed: only pending or confirmed orders can be cancelled", 400);
    }

    try {
      await this.repository.updateOrderStatus(order.order_id, "cancelled");

      try {
        await this.repository.updatePaymentStatus({
          orderId: order.order_id,
          status: "cancelled",
          transactionId: null,
          paymentDate: null,
        });
      } catch (paymentUpdateError) {
        if (!this.isLegacyPaymentStatusConstraintError(paymentUpdateError)) {
          throw paymentUpdateError;
        }

        // Backward compatibility for databases that still enforce pending/paid/failed only.
        await this.repository.updatePaymentStatus({
          orderId: order.order_id,
          status: "failed",
          transactionId: null,
          paymentDate: null,
        });
      }

      await this.repository.insertTracking({
        orderId: order.order_id,
        status: "cancelled",
        note: (input.note ?? "").trim() || "Order cancelled by customer",
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to cancel order", 500);
    }

    return {
      order_id: order.order_id,
      status: "cancelled",
      message: "Cancellation Successful",
    };
  }

  async confirmPayment(input: ConfirmPaymentInput): Promise<{ order_id: string; status: OrderStatus; payment_status: "paid"; message: string }> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (!input.orderId.trim()) {
      throw new AppError("orderId is required", 400);
    }

    let order: Awaited<ReturnType<OrderRepository["findOrderById"]>> = null;
    try {
      order = await this.repository.findOrderById(input.orderId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load order", 500);
    }

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.user_id !== input.userId.trim()) {
      throw new AppError("Access denied for this order", 403);
    }

    if (order.status === "cancelled") {
      throw new AppError("Payment cannot be confirmed for a cancelled order", 400);
    }

    let paymentInfo: Awaited<ReturnType<OrderRepository["findPaymentInfo"]>> | null = null;
    try {
      paymentInfo = await this.repository.findPaymentInfo(order.order_id);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load payment info", 500);
    }

    const paymentStatus = this.normalizePaymentStatus(paymentInfo.status);
    if (paymentStatus === "paid") {
      return {
        order_id: order.order_id,
        status: order.status,
        payment_status: "paid",
        message: "Payment is already confirmed",
      };
    }

    if (paymentStatus === "cancelled") {
      throw new AppError("Payment was cancelled for this order", 400);
    }

    const nextOrderStatus: OrderStatus = order.status === "pending" ? "confirmed" : order.status;

    try {
      if (order.status === "pending") {
        await this.repository.updateOrderStatus(order.order_id, nextOrderStatus);
      }

      await this.repository.updatePaymentStatus({
        orderId: order.order_id,
        status: "paid",
        transactionId: null,
        paymentDate: new Date().toISOString(),
      });

      await this.repository.insertTracking({
        orderId: order.order_id,
        status: nextOrderStatus,
        note: "Khách hàng đã trả tiền",
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to confirm payment", 500);
    }

    return {
      order_id: order.order_id,
      status: nextOrderStatus,
      payment_status: "paid",
      message: "Payment confirmed successfully",
    };
  }

  async updateOrder(input: UpdateOrderInput): Promise<{ order_id: string; message: string }> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (!input.orderId.trim()) {
      throw new AppError("orderId is required", 400);
    }

    let order: Awaited<ReturnType<OrderRepository["findOrderById"]>> = null;
    try {
      order = await this.repository.findOrderById(input.orderId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load order", 500);
    }

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.user_id !== input.userId.trim()) {
      throw new AppError("Access denied for this order", 403);
    }

    const state = createOrderState(order.status);
    if (!state.canCancel()) {
      throw new AppError("Update failed: only pending or confirmed orders can be updated", 400);
    }

    const hasDeliveryAddress = typeof input.deliveryAddress === "string" && input.deliveryAddress.trim().length > 0;
    const hasDeliveryFee = typeof input.deliveryFee === "number";
    const hasNote = typeof input.note !== "undefined";

    if (!hasDeliveryAddress && !hasDeliveryFee && !hasNote) {
      throw new AppError("At least one field to update is required", 400);
    }

    const normalizedDeliveryFee = hasDeliveryFee ? Number(input.deliveryFee) : undefined;
    if (typeof normalizedDeliveryFee === "number" && (!Number.isFinite(normalizedDeliveryFee) || normalizedDeliveryFee < 0)) {
      throw new AppError("deliveryFee must be >= 0", 400);
    }

    try {
      await this.repository.updateOrderFields({
        orderId: order.order_id,
        deliveryAddress: hasDeliveryAddress ? input.deliveryAddress?.trim() : undefined,
        deliveryFee: normalizedDeliveryFee,
        note: hasNote ? (input.note ?? "").trim() || null : undefined,
      });
      await this.repository.insertTracking({
        orderId: order.order_id,
        status: order.status,
        note: "Order details updated",
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to update order", 500);
    }

    return {
      order_id: order.order_id,
      message: "Order updated successfully",
    };
  }
}

export const orderService = new OrderService();
