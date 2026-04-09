"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "../../dashboard/components/NavigationBar";
import ConfirmationDialog from "../../shared/components/ConfirmationDialog";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled";
type MainTab = "cart" | "orders";

type CartItemView = {
  cart_item_id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  note: string | null;
  product_price: number | null;
  subtotal: number;
};

type CartResponse = {
  user_id: string;
  cart_id: string;
  items: CartItemView[];
  cart_total: number;
};

type OrderItem = {
  order_id: string;
  order_date: string;
  status: OrderStatus;
  status_label: string;
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  note: string | null;
  created_at: string;
  preview_images: string[];
};

type OrdersResponse = {
  items: OrderItem[];
};

type CreateOrderResponse = {
  order_id: string;
  status: "pending";
  total_amount: number;
};

type StatusConfig = {
  label: string;
  cardBorder: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
};

type TabValue = "all" | OrderStatus;

const DELIVERY_FEE = 15000;

const ORDER_STATUS_SEQUENCE: OrderStatus[] = ["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"];

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: "Chờ xác nhận",
    cardBorder: "#FFEDD5",
    chipBg: "#FFF7ED",
    chipBorder: "#FED7AA",
    chipText: "#EA580C",
  },
  confirmed: {
    label: "Đã xác nhận",
    cardBorder: "#DBEAFE",
    chipBg: "#EFF6FF",
    chipBorder: "#BFDBFE",
    chipText: "#2563EB",
  },
  preparing: {
    label: "Đang chuẩn bị",
    cardBorder: "#E0E7FF",
    chipBg: "#EEF2FF",
    chipBorder: "#C7D2FE",
    chipText: "#4338CA",
  },
  delivering: {
    label: "Đang giao",
    cardBorder: "#DBEAFE",
    chipBg: "#EFF6FF",
    chipBorder: "#BFDBFE",
    chipText: "#2563EB",
  },
  completed: {
    label: "Hoàn thành",
    cardBorder: "#D1FAE5",
    chipBg: "#ECFDF5",
    chipBorder: "#A7F3D0",
    chipText: "#059669",
  },
  cancelled: {
    label: "Đã hủy",
    cardBorder: "#E5E7EB",
    chipBg: "#F3F4F6",
    chipBorder: "#D1D5DB",
    chipText: "#4B5563",
  },
};

const STATUS_TABS: Array<{ value: TabValue; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: STATUS_CONFIG.pending.label },
  { value: "confirmed", label: STATUS_CONFIG.confirmed.label },
  { value: "preparing", label: STATUS_CONFIG.preparing.label },
  { value: "delivering", label: STATUS_CONFIG.delivering.label },
  { value: "completed", label: STATUS_CONFIG.completed.label },
  { value: "cancelled", label: STATUS_CONFIG.cancelled.label },
];

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    fontFamily: "'Inter', sans-serif",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `18px ${SCREEN_HEADER_PADDING_X} 10px`,
    minHeight: "64px",
    flexShrink: 0,
    background: "#FFFFFF",
    borderBottom: "1px solid #F3F4F6",
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "18px",
    lineHeight: "28px",
    color: "#111827",
    margin: 0,
  },
  backLink: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1E1E1E",
    textDecoration: "none",
  },
  tabsWrap: {
    background: "#FFFFFF",
    borderBottom: "1px solid #F3F4F6",
    overflowX: "auto",
    overflowY: "hidden",
    whiteSpace: "nowrap",
    padding: "0 8px",
  },
  tabsRow: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "46px",
  },
  tabBtn: {
    border: "none",
    background: "transparent",
    padding: "12px 16px",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    color: "#6B7280",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabBtnActive: {
    color: "#4EA96A",
    fontWeight: 700,
    borderBottom: "2px solid #4EA96A",
  },
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 132px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
  },
  statusSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    fontWeight: 700,
    color: "#374151",
    letterSpacing: "0.02em",
  },
  infoText: {
    margin: 0,
    color: "#6B7280",
    textAlign: "center",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "10px 0",
  },
  errorText: {
    margin: 0,
    color: "#B91C1C",
    textAlign: "center",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "10px 0",
  },
  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  orderCard: {
    borderRadius: "16px",
    border: "1px solid #DBEAFE",
    background: "#FFFFFF",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    cursor: "pointer",
  },
  orderTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
    paddingBottom: "12px",
    borderBottom: "1px solid #F3F4F6",
  },
  shopWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  shopIcon: {
    width: "16px",
    height: "16px",
    color: "#6B7280",
  },
  shopName: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
    color: "#111827",
  },
  statusBadge: {
    borderRadius: "9999px",
    border: "1px solid #BFDBFE",
    background: "#EFF6FF",
    color: "#2563EB",
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: 700,
    padding: "4px 10px",
  },
  metaGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  metaRow: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "12px",
    lineHeight: "16px",
  },
  metaLabel: {
    color: "#6B7280",
    fontWeight: 400,
  },
  metaValue: {
    color: "#111827",
    fontWeight: 500,
    textAlign: "right",
  },
  previewRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  previewThumb: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
    background: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6B7280",
    fontWeight: 700,
    fontSize: "12px",
    flexShrink: 0,
    objectFit: "cover",
    overflow: "hidden",
  },
  previewSpacer: {
    marginLeft: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  amountLabel: {
    margin: 0,
    color: "#6B7280",
    fontSize: "10px",
    lineHeight: "15px",
  },
  amountText: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#111827",
  },
  actionsRow: {
    borderTop: "1px solid #F9FAFB",
    paddingTop: "12px",
    display: "flex",
    gap: "12px",
  },
  actionButton: {
    flex: 1,
    borderRadius: "12px",
    height: "38px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#374151",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    cursor: "pointer",
  },
  actionButtonPrimary: {
    background: "#4EA96A",
    border: "1px solid #4EA96A",
    color: "#FFFFFF",
    fontWeight: 700,
    boxShadow: "0px 4px 6px -1px rgba(78, 169, 106, 0.2), 0px 2px 4px -2px rgba(78, 169, 106, 0.2)",
  },
  actionButtonMuted: {
    background: "#F3F4F6",
    border: "1px solid #E5E7EB",
    color: "#9CA3AF",
    fontWeight: 700,
  },
};

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toStatus(value: string): OrderStatus {
  if (ORDER_STATUS_SEQUENCE.includes(value as OrderStatus)) {
    return value as OrderStatus;
  }

  return "pending";
}

function buildPreviewTokens(orderId: string, count: number): string[] {
  const seed = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const tokens = [];
  
  for (let i = 0; i < Math.min(count, 3); i++) {
    if (i === 2 && count > 3) {
      tokens.push(`+${count - 2}`);
    } else if (seed.length >= (i + 1) * 2) {
      tokens.push(seed.slice(i * 2, (i + 1) * 2));
    } else {
      tokens.push(i === 0 ? "GP" : i === 1 ? "EC" : "+1");
    }
  }
  
  return tokens;
}

function buildPreviewImages(images: string[]): string[] {
  return images.filter((value) => value.trim().length > 0).slice(0, 3);
}

function getCardActions(status: OrderStatus): { left?: string; right: string; mutedRight?: boolean } {
  if (status === "pending" || status === "confirmed") {
    return { left: "Hủy đơn hàng", right: "Đang xử lý...", mutedRight: true };
  }

  if (status === "delivering") {
    return { left: "Liên hệ Shop", right: "Theo dõi đơn" };
  }

  if (status === "completed") {
    return { left: "Đánh giá ngay", right: "Mua lại" };
  }

  if (status === "cancelled") {
    return { right: "Mua lại sản phẩm" };
  }

  return { right: "Đang xử lý...", mutedRight: true };
}

function getStatusGroupLabel(status: OrderStatus): string {
  if (status === "pending") {
    return "Đơn chờ xác nhận";
  }

  if (status === "confirmed") {
    return "Đơn đã xác nhận";
  }

  if (status === "preparing") {
    return "Đơn đang chuẩn bị";
  }

  if (status === "delivering") {
    return "Đơn đang giao";
  }

  if (status === "completed") {
    return "Đơn hoàn thành";
  }

  return "Đơn đã hủy";
}

export default function Orders() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [mainTab, setMainTab] = useState<MainTab>("cart");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItemView[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartId, setCartId] = useState<string>("");
  
  // Orders state
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [cancelTarget, setCancelTarget] = useState<OrderItem | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        // Load both cart and orders in parallel
        const [cartResponse, ordersResponse] = await Promise.all([
          fetch(`/api/cart?userId=${encodeURIComponent(user.user_id)}`, { signal: controller.signal }),
          fetch(`/api/orders?userId=${encodeURIComponent(user.user_id)}`, { signal: controller.signal }),
        ]);

        if (!cartResponse.ok) {
          throw new Error("Không thể tải giỏ hàng.");
        }

        if (!ordersResponse.ok) {
          throw new Error("Không thể tải danh sách đơn hàng.");
        }

        const cartData = (await cartResponse.json()) as CartResponse | { error?: string };
        const ordersData = (await ordersResponse.json()) as OrdersResponse | { error?: string };

        if ("items" in cartData) {
          setCartItems(cartData.items ?? []);
          setCartTotal(cartData.cart_total ?? 0);
          setCartId(cartData.cart_id ?? "");
        }

        if ("items" in ordersData) {
          const nextOrders = ((ordersData as OrdersResponse).items ?? []).map((item) => ({
            ...item,
            status: toStatus(item.status),
          }));
          setOrders(nextOrders);
        }
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setCartItems([]);
        setOrders([]);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, router, user]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") {
      return orders;
    }

    return orders.filter((item) => item.status === activeTab);
  }, [activeTab, orders]);

  const groupedOrders = useMemo(() => {
    const groups: Record<OrderStatus, OrderItem[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      delivering: [],
      completed: [],
      cancelled: [],
    };

    filteredOrders.forEach((order) => {
      groups[order.status].push(order);
    });

    return groups;
  }, [filteredOrders]);

  const hasOrders = filteredOrders.length > 0;

  const handleOpenCancelPrompt = (order: OrderItem) => {
    setCancelTarget(order);
  };

  const handleCloseCancelPrompt = () => {
    if (saving) {
      return;
    }

    setCancelTarget(null);
  };

  const handleConfirmCancelOrder = async () => {
    if (!user?.user_id || !cancelTarget) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(cancelTarget.order_id)}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          note: "Hủy từ danh sách đơn hàng",
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(String(data.error ?? "Không thể hủy đơn hàng."));
      }

      setOrders((current) =>
        current.map((item) =>
          item.order_id === cancelTarget.order_id
            ? {
                ...item,
                status: "cancelled",
                status_label: "Cancelled",
              }
            : item,
        ),
      );
      setMessage(`Đã hủy đơn #${cancelTarget.order_id.slice(0, 8).toUpperCase()} thành công.`);
      setCancelTarget(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể hủy đơn hàng.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!user?.user_id || !cartId || cartItems.length === 0) {
      setError("Giỏ hàng trống hoặc thông tin không đầy đủ.");
      return;
    }

    const deliveryAddress = (user.address ?? "").trim();
    if (!deliveryAddress) {
      setError("Vui lòng cập nhật địa chỉ trong hồ sơ trước khi đặt hàng.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          deliveryAddress,
          cartId: cartId,
          deliveryFee: DELIVERY_FEE,
          note: "",
        }),
      });

      const data = (await response.json()) as CreateOrderResponse | { error?: string };
      if (!response.ok) {
        const errorMsg = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
        throw new Error(errorMsg || "Không thể tạo đơn hàng.");
      }

      const orderData = data as CreateOrderResponse;
      void router.push(`/orders/${orderData.order_id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tạo đơn hàng.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = STATUS_TABS;

  const formatPrice = (value: number): string => {
    return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  };

  const renderCartSection = () => (
    <main style={styles.mainContent}>
      {!initialized && <p style={styles.infoText}>Đang kiểm tra phiên đăng nhập...</p>}
      {initialized && isAuthenticated && loading && <p style={styles.infoText}>Đang tải giỏ hàng...</p>}
      {initialized && isAuthenticated && error && <p style={styles.errorText}>{error}</p>}
      {initialized && isAuthenticated && message && <p style={styles.infoText}>{message}</p>}
      {initialized && isAuthenticated && !loading && !error && cartItems.length === 0 && (
        <p style={styles.infoText}>Giỏ hàng của bạn trống.</p>
      )}

      {initialized && isAuthenticated && !loading && cartItems.length > 0 && (
        <div style={styles.orderList}>
          {cartItems.map((item) => (
            <div
              key={item.cart_item_id}
              style={{
                ...styles.orderCard,
                borderColor: "#DBEAFE",
                display: "flex",
                flexDirection: "row",
                padding: "12px",
                gap: "12px",
              }}
            >
              {item.product_image_url ? (
                <img
                  src={item.product_image_url}
                  alt={item.product_name}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    background: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9CA3AF",
                  }}
                >
                  No Image
                </div>
              )}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                    {item.product_name}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                    Số lượng: {item.quantity}
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            </div>
          ))}

          <div
            style={{
              paddingTop: "16px",
              borderTop: "1px solid #F3F4F6",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "#6B7280" }}>Tị̉n hàng:</span>
              <span style={{ fontWeight: 600, color: "#111827" }}>{formatPrice(cartTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "#6B7280" }}>Phí giao hàng:</span>
              <span style={{ fontWeight: 600, color: "#111827" }}>{formatPrice(DELIVERY_FEE)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16px",
                fontWeight: 700,
                paddingTop: "12px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <span>Tổng cộng:</span>
              <span style={{ color: "#4EA96A" }}>{formatPrice(cartTotal + DELIVERY_FEE)}</span>
            </div>

            <button
              type="button"
              style={{
                ...styles.actionButtonPrimary,
                marginTop: "12px",
                height: "44px",
                fontSize: "16px",
                fontWeight: 700,
              }}
              onClick={handleCheckout}
              disabled={saving}
            >
              {saving ? "Đang xử lý..." : "Thanh toán"}
            </button>
          </div>
        </div>
      )}
    </main>
  );

  const renderOrdersSection = () => (
    <>
      <section style={styles.tabsWrap}>
        <div style={styles.tabsRow}>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab.value ? styles.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <main style={styles.mainContent}>
        {!initialized && <p style={styles.infoText}>Đang kiểm tra phiên đăng nhập...</p>}
        {initialized && isAuthenticated && loading && <p style={styles.infoText}>Đang tải đơn hàng...</p>}
        {initialized && isAuthenticated && error && <p style={styles.errorText}>{error}</p>}
        {initialized && isAuthenticated && message && <p style={styles.infoText}>{message}</p>}
        {initialized && isAuthenticated && !loading && !error && !hasOrders && (
          <p style={styles.infoText}>Bạn chưa có đơn hàng nào.</p>
        )}

        {initialized && isAuthenticated && hasOrders && (
          <>
            {ORDER_STATUS_SEQUENCE.map((status) => {
              if (activeTab !== "all" && activeTab !== status) {
                return null;
              }

              const sectionOrders = groupedOrders[status];
              if (sectionOrders.length === 0) {
                return null;
              }

              return (
                <section key={status} style={styles.statusSection}>
                  <h2 style={styles.sectionTitle}>{getStatusGroupLabel(status)}</h2>
                  <div style={styles.orderList}>{sectionOrders.map((order) => renderOrderCard(order))}</div>
                </section>
              );
            })}
          </>
        )}
      </main>
    </>
  );

  const renderOrderCard = (order: OrderItem) => {
    const status = toStatus(order.status);
    const config = STATUS_CONFIG[status];
    const actions = getCardActions(status);
    const previewImages = buildPreviewImages(order.preview_images ?? []);
    const previewTokens = buildPreviewTokens(order.order_id, previewImages.length);

    return (
      <article
        key={order.order_id}
        style={{ ...styles.orderCard, borderColor: config.cardBorder, opacity: status === "cancelled" ? 0.82 : 1 }}
        onClick={() => router.push(`/orders/${order.order_id}`)}
      >
        <div style={styles.orderTop}>
          <div style={styles.shopWrap}>
            <svg viewBox="0 0 24 24" fill="none" style={styles.shopIcon}>
              <path d="M3 9.5V20h18V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 9.5L5.2 4h13.6L21 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <p style={styles.shopName}>GreenPlus Shop</p>
          </div>
          <span
            style={{
              ...styles.statusBadge,
              background: config.chipBg,
              borderColor: config.chipBorder,
              color: config.chipText,
            }}
          >
            {config.label}
          </span>
        </div>

        <div style={styles.metaGroup}>
          <p style={styles.metaRow}>
            <span style={styles.metaLabel}>Mã đơn:</span>
            <span style={styles.metaValue}>#{order.order_id.slice(0, 8).toUpperCase()}</span>
          </p>
          <p style={styles.metaRow}>
            <span style={styles.metaLabel}>Đặt lúc:</span>
            <span style={styles.metaValue}>{formatDateTime(order.order_date)}</span>
          </p>
        </div>

        <div style={styles.previewRow}>
          {previewImages.map((imageUrl, index) => {
            const fallbackToken = previewTokens[index] ?? "GP";

            if (!imageUrl) {
              return (
                <div key={`${order.order_id}-fallback-${index}`} style={styles.previewThumb}>
                  {fallbackToken}
                </div>
              );
            }

            return <img key={`${order.order_id}-img-${index}`} src={imageUrl} alt={`Sản phẩm ${index + 1}`} style={styles.previewThumb} />;
          })}
          <div style={styles.previewSpacer}>
            <p style={styles.amountLabel}>Tổng tiền</p>
            <p style={styles.amountText}>{formatPrice(order.total_amount)}</p>
          </div>
        </div>

        <div style={styles.actionsRow}>
          {actions.left ? (
            <button
              type="button"
              style={styles.actionButton}
              onClick={(event) => {
                event.stopPropagation();
                if (status === "pending" || status === "confirmed") {
                  handleOpenCancelPrompt(order);
                }
              }}
            >
              {actions.left}
            </button>
          ) : null}
          <button
            type="button"
            style={{
              ...styles.actionButton,
              ...(actions.mutedRight ? styles.actionButtonMuted : styles.actionButtonPrimary),
              flex: actions.left ? 1 : 2,
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {actions.right}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href="/dashboard" style={styles.backLink} aria-label="Quay lại dashboard">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.headerTitle}>{mainTab === "cart" ? "Giỏ hàng" : "Đơn hàng"}</h1>
          <div style={{ width: "24px" }} />
        </header>

        <section style={styles.tabsWrap}>
          <div style={styles.tabsRow}>
            <button
              type="button"
              style={{
                ...styles.tabBtn,
                ...(mainTab === "cart" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setMainTab("cart")}
            >
              Giỏ Hàng
            </button>
            <button
              type="button"
              style={{
                ...styles.tabBtn,
                ...(mainTab === "orders" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setMainTab("orders")}
            >
              Đơn Hàng
            </button>
          </div>
        </section>

        {mainTab === "cart" ? renderCartSection() : renderOrdersSection()}

        <ConfirmationDialog
          open={Boolean(cancelTarget)}
          title="Xác nhận hủy đơn hàng"
          message={
            cancelTarget
              ? `Bạn có chắc muốn hủy đơn #${cancelTarget.order_id.slice(0, 8).toUpperCase()}? Hành động này sẽ cập nhật trạng thái đơn và thanh toán.`
              : ""
          }
          confirmLabel="Hủy đơn"
          cancelLabel="Giữ lại"
          confirmTone="danger"
          busy={saving}
          onCancel={handleCloseCancelPrompt}
          onConfirm={() => void handleConfirmCancelOrder()}
        />

        <NavigationBar />
      </div>
    </div>
  );
}
