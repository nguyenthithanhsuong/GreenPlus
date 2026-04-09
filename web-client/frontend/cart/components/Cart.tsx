"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

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

type CreateOrderResponse = {
  order_id: string;
  status: "pending";
  total_amount: number;
};

const DELIVERY_FEE = 15000;

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
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "20px",
    color: "#1E1E1E",
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
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  summaryCard: {
    borderRadius: "20px",
    background: "linear-gradient(160deg, #0f172a 0%, #115e59 60%, #10b981 100%)",
    color: "#FFFFFF",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
  },
  summaryLabel: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    opacity: 0.85,
  },
  summaryTitle: {
    margin: 0,
    fontSize: "22px",
    lineHeight: "28px",
    fontWeight: 700,
  },
  summaryText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    color: "rgba(236, 253, 245, 0.92)",
  },
  cartList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cartCard: {
    borderRadius: "18px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "14px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  productThumb: {
    width: "74px",
    height: "74px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    objectFit: "cover",
    flexShrink: 0,
    background: "#F9FAFB",
  },
  productThumbFallback: {
    width: "74px",
    height: "74px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#F3F4F6",
    color: "#9CA3AF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  cartBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },
  cartTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  cartName: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "22px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  cartMeta: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6B7280",
  },
  quantityBadge: {
    borderRadius: "999px",
    background: "#EAFBF0",
    color: "#1A4331",
    fontSize: "12px",
    fontWeight: 700,
    padding: "6px 10px",
    whiteSpace: "nowrap",
  },
  cartFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  priceText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  noteText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#6B7280",
  },
  totalCard: {
    borderRadius: "18px",
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  orderButton: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    background: "#0F9D58",
    color: "#FFFFFF",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  totalLabel: {
    margin: 0,
    fontSize: "14px",
    color: "#6B7280",
  },
  totalValue: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
    color: "#1A4331",
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
  authCard: {
    borderRadius: "18px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "center",
  },
  authLink: {
    display: "inline-block",
    alignSelf: "center",
    padding: "10px 16px",
    borderRadius: "14px",
    background: "#51B788",
    color: "#FFFFFF",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
};

function formatPrice(value: number | null): string {
  if (value === null) {
    return "Liên hệ";
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export default function Cart() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();

    const loadCart = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/cart?userId=${encodeURIComponent(user.user_id)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as CartResponse | { error?: string };

        if (!response.ok) {
          const message = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(message || "Không thể tải giỏ hàng.");
        }

        setCart(data as CartResponse);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setCart(null);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải giỏ hàng.");
      } finally {
        setLoading(false);
      }
    };

    void loadCart();

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, router, user]);

  const cartItems = useMemo(() => cart?.items ?? [], [cart]);

  const handleProceedToPayment = async () => {
    if (!user?.user_id) {
      setError("Vui lòng đăng nhập để đặt hàng.");
      return;
    }

    const deliveryAddress = (user.address ?? "").trim();
    if (!deliveryAddress) {
      setError("Vui lòng cập nhật địa chỉ trong hồ sơ trước khi đặt hàng.");
      return;
    }

    setError(null);
    setPlacingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          deliveryAddress,
          deliveryFee: DELIVERY_FEE,
          note: "",
          paymentMethod: "cod",
        }),
      });

      const data = (await response.json()) as CreateOrderResponse | { error?: string };
      if (!response.ok) {
        const message = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
        throw new Error(message || "Không thể tạo đơn hàng.");
      }

      router.push(`/orders/${encodeURIComponent((data as CreateOrderResponse).order_id)}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tạo đơn hàng.");
    } finally {
      setPlacingOrder(false);
    }
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
          <h1 style={styles.headerTitle}>Giỏ Hàng</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          {!initialized && <p style={styles.infoText}>Đang kiểm tra phiên đăng nhập...</p>}

          {initialized && !isAuthenticated && (
            <div style={styles.authCard}>
              <p style={styles.cartName}>Vui lòng đăng nhập</p>
              <p style={styles.cartMeta}>Giỏ hàng được tải theo tài khoản của bạn.</p>
              <Link href="/login" style={styles.authLink}>
                Đi tới đăng nhập
              </Link>
            </div>
          )}

          {initialized && isAuthenticated && user && (
            <section style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Tài khoản hiện tại</p>
              <h2 style={styles.summaryTitle}>{user.name}</h2>
              <p style={styles.summaryText}>{user.email}</p>
            </section>
          )}

          {initialized && isAuthenticated && loading && <p style={styles.infoText}>Đang tải giỏ hàng...</p>}
          {initialized && isAuthenticated && error && <p style={styles.errorText}>{error}</p>}

          {initialized && isAuthenticated && !loading && !error && cartItems.length === 0 && (
            <p style={styles.infoText}>Giỏ hàng hiện đang trống.</p>
          )}

          {initialized && isAuthenticated && cartItems.length > 0 && (
            <section style={styles.cartList}>
              {cartItems.map((item) => (
                <article key={item.cart_item_id} style={styles.cartCard}>
                  {item.product_image_url ? (
                    <img src={item.product_image_url} alt={item.product_name} style={styles.productThumb} />
                  ) : (
                    <div style={styles.productThumbFallback}>No image</div>
                  )}
                  <div style={styles.cartBody}>
                    <div style={styles.cartTop}>
                      <div>
                        <p style={styles.cartName}>{item.product_name}</p>
                        <p style={styles.cartMeta}>Mã sản phẩm: {item.product_id}</p>
                      </div>
                      <div style={styles.quantityBadge}>x{item.quantity}</div>
                    </div>
                    <p style={styles.noteText}>{item.note ?? "Không có ghi chú"}</p>
                    <div style={styles.cartFooter}>
                      <p style={styles.priceText}>{formatPrice(item.product_price)}</p>
                      <p style={styles.cartMeta}>Tạm tính: {formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          {initialized && isAuthenticated && cart && (
            <section style={styles.totalCard}>
              <p style={styles.totalLabel}>Tổng giỏ hàng</p>
              <p style={styles.totalValue}>{formatPrice(cart.cart_total)}</p>
            </section>
          )}

          {initialized && isAuthenticated && cartItems.length > 0 && (
            <button type="button" style={styles.orderButton} onClick={() => void handleProceedToPayment()} disabled={placingOrder}>
              {placingOrder ? "Đang tạo đơn..." : "Tạo đơn hàng"}
            </button>
          )}
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
