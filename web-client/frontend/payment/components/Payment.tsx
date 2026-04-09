"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type CartItemView = {
  cart_item_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
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

type PaymentMethod = "cod" | "momo" | "vnpay";

const DELIVERY_FEE = 15000;
const PROMOTION = 10000;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    position: "relative",
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FCFDFE",
    margin: "0 auto",
    boxSizing: "border-box",
    boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: `18px ${SCREEN_HEADER_PADDING_X} 14px`,
    minHeight: "72px",
    background: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
  },
  backLink: {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1F2937",
    textDecoration: "none",
    borderRadius: "999px",
  },
  headerTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: "18px",
    lineHeight: "28px",
    color: "#111827",
  },
  scrollBody: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 156px`,
  },
  sectionCard: {
    width: "100%",
    borderRadius: "16px",
    background: "#FFFFFF",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    padding: "16px",
    boxSizing: "border-box",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  sectionIcon: {
    width: "18px",
    height: "18px",
    color: "#10B981",
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: "15px",
    lineHeight: "24px",
    color: "#111827",
  },
  addressRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  nameRow: {
    margin: 0,
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  nameText: {
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#111827",
  },
  phoneText: {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#9CA3AF",
  },
  addressText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "22px",
    color: "#4B5563",
  },
  editHint: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "18px",
    color: "#9CA3AF",
  },
  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  itemRow: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  itemThumb: {
    width: "64px",
    height: "64px",
    borderRadius: "12px",
    background: "#F3F4F6",
    border: "1px solid #E5E7EB",
    objectFit: "cover",
    flexShrink: 0,
  },
  itemThumbFallback: {
    width: "64px",
    height: "64px",
    borderRadius: "12px",
    background: "#F3F4F6",
    border: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9CA3AF",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  itemBody: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "20px",
    color: "#111827",
    fontWeight: 700,
  },
  itemMeta: {
    margin: 0,
    fontSize: "11px",
    lineHeight: "16px",
    color: "#6B7280",
  },
  itemPriceRow: {
    marginTop: "2px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  itemPrice: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "20px",
    color: "#059669",
    fontWeight: 700,
  },
  itemQty: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "20px",
    color: "#6B7280",
  },
  noteWrap: {
    borderTop: "1px solid #F3F4F6",
    paddingTop: "16px",
  },
  noteInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "13px",
    lineHeight: "16px",
    color: "#111827",
    outline: "none",
  },
  paymentOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  paymentOption: {
    width: "100%",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    background: "#FFFFFF",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    cursor: "pointer",
  },
  paymentOptionActive: {
    background: "rgba(236, 253, 245, 0.5)",
    border: "1px solid #10B981",
  },
  paymentLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  paymentIconWrap: {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    background: "#FFFFFF",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentName: {
    margin: 0,
    color: "#1F2937",
    fontSize: "13px",
    lineHeight: "20px",
  },
  radioOuter: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    border: "1px solid #D1D5DB",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioOuterActive: {
    border: "1px solid #10B981",
    background: "#10B981",
  },
  radioInner: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#FFFFFF",
  },
  summaryRows: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  summaryRow: {
    margin: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "13px",
    lineHeight: "20px",
  },
  summaryLabel: {
    color: "#4B5563",
  },
  summaryValue: {
    color: "#4B5563",
  },
  summaryPromo: {
    color: "#059669",
  },
  bottomBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    display: "flex",
    justifyContent: "center",
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
    boxSizing: "border-box",
    pointerEvents: "none",
  },
  bottomBarInner: {
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    background: "#FFFFFF",
    borderTop: "1px solid #E5E7EB",
    boxShadow: "0px -4px 20px -10px rgba(0, 0, 0, 0.1)",
    borderRadius: "0px 0px 32px 32px",
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 24px`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
    pointerEvents: "auto",
  },
  payRow: {
    margin: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  payLabel: {
    color: "#4B5563",
    fontSize: "13px",
    lineHeight: "20px",
  },
  payValue: {
    color: "#059669",
    fontSize: "18px",
    lineHeight: "28px",
    fontWeight: 700,
  },
  orderButton: {
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "12px",
    background: "#4EA96A",
    color: "#FFFFFF",
    fontSize: "15px",
    lineHeight: "24px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0px 10px 15px -3px rgba(16, 185, 129, 0.3), 0px 4px 6px -4px rgba(16, 185, 129, 0.3)",
  },
  infoText: {
    margin: 0,
    color: "#6B7280",
    textAlign: "center",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "8px 0",
  },
  errorText: {
    margin: 0,
    color: "#B91C1C",
    textAlign: "center",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "8px 0",
  },
};

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export default function Payment() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

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
          const responseError = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(responseError || "Không thể tải dữ liệu thanh toán.");
        }

        const cartData = data as CartResponse;
        if ((cartData.items ?? []).length === 0) {
          router.replace("/cart");
          return;
        }

        setCart(cartData);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setCart(null);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    void loadCart();

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, router, user]);

  const itemTotal = useMemo(() => Number(cart?.cart_total ?? 0), [cart]);
  const shippingFee = useMemo(() => (itemTotal > 0 ? DELIVERY_FEE : 0), [itemTotal]);
  const promoValue = useMemo(() => (itemTotal > 0 ? PROMOTION : 0), [itemTotal]);
  const grandTotal = useMemo(() => Math.max(itemTotal + shippingFee - promoValue, 0), [itemTotal, shippingFee, promoValue]);

  const handlePlaceOrder = async () => {
    if (!user?.user_id) {
      setMessage("Vui lòng đăng nhập để đặt hàng.");
      return;
    }

    const deliveryAddress = (user.address ?? "").trim();
    if (!deliveryAddress) {
      setMessage("Vui lòng cập nhật địa chỉ trong hồ sơ trước khi thanh toán.");
      return;
    }

    setMessage(null);
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
          deliveryFee: shippingFee,
          note: note.trim(),
          paymentMethod,
        }),
      });

      const data = (await response.json()) as CreateOrderResponse | { error?: string };
      if (!response.ok) {
        const responseError = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
        throw new Error(responseError || "Không thể tạo đơn hàng.");
      }

      setMessage("Đặt hàng thành công.");
      router.push("/orders");
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Không thể tạo đơn hàng.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link href="/cart" style={styles.backLink} aria-label="Quay lại giỏ hàng">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.headerTitle}>Thanh Toán</h1>
        </header>

        <main style={styles.scrollBody}>
          {!initialized && <p style={styles.infoText}>Đang kiểm tra phiên đăng nhập...</p>}
          {initialized && isAuthenticated && loading && <p style={styles.infoText}>Đang tải thông tin thanh toán...</p>}
          {initialized && isAuthenticated && error && <p style={styles.errorText}>{error}</p>}

          {initialized && isAuthenticated && !loading && cart && (
            <>
              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <svg viewBox="0 0 24 24" fill="none" style={styles.sectionIcon}>
                    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <h2 style={styles.sectionTitle}>Địa chỉ nhận hàng</h2>
                </div>

                <div style={styles.addressRow}>
                  <div>
                    <p style={styles.nameRow}>
                      <span style={styles.nameText}>{user?.name ?? "Người dùng"}</span>
                      <span style={styles.phoneText}>{user?.phone ?? "Chưa cập nhật"}</span>
                    </p>
                    <p style={styles.addressText}>{user?.address ?? "Chưa cập nhật địa chỉ"}</p>
                  </div>
                  <p style={styles.editHint}>Sửa ở Hồ sơ</p>
                </div>
              </section>

              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <svg viewBox="0 0 24 24" fill="none" style={styles.sectionIcon}>
                    <path d="M3 7h18" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 7l1.2-3h11.6L19 7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 7v13h14V7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 11h6" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <h2 style={styles.sectionTitle}>Chi tiết đơn hàng</h2>
                </div>

                <div style={styles.itemList}>
                  {cart.items.map((item, index) => (
                    <div
                      key={item.cart_item_id}
                      style={{
                        ...styles.itemRow,
                        ...(index > 0
                          ? {
                              borderTop: "1px solid #F3F4F6",
                              paddingTop: "16px",
                            }
                          : {}),
                      }}
                    >
                      {item.product_image_url ? (
                        <img src={item.product_image_url} alt={item.product_name} style={styles.itemThumb} />
                      ) : (
                        <div style={styles.itemThumbFallback}>No img</div>
                      )}
                      <div style={styles.itemBody}>
                        <p style={styles.itemName}>{item.product_name}</p>
                        <p style={styles.itemMeta}>Sản phẩm hữu cơ GreenPlus</p>
                        <div style={styles.itemPriceRow}>
                          <p style={styles.itemPrice}>{formatPrice(Number(item.subtotal))}</p>
                          <p style={styles.itemQty}>x{item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.noteWrap}>
                  <input
                    type="text"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    style={styles.noteInput}
                    placeholder="Ghi chú cho cửa hàng (vd: chọn rau non...)"
                  />
                </div>
              </section>

              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Phương thức thanh toán</h2>
                </div>

                <div style={styles.paymentOptions}>
                  {[
                    { value: "cod" as const, label: "Thanh toán khi nhận hàng (COD)", color: "#059669", icon: "C" },
                    { value: "momo" as const, label: "Ví MoMo", color: "#EC4899", icon: "M" },
                    { value: "vnpay" as const, label: "VNPay", color: "#2563EB", icon: "V" },
                  ].map((option) => {
                    const isActive = paymentMethod === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        style={{
                          ...styles.paymentOption,
                          ...(isActive ? styles.paymentOptionActive : {}),
                        }}
                        onClick={() => setPaymentMethod(option.value)}
                      >
                        <span style={styles.paymentLeft}>
                          <span style={styles.paymentIconWrap}>
                            <span style={{ fontWeight: 700, color: option.color, fontSize: "13px" }}>{option.icon}</span>
                          </span>
                          <span style={styles.paymentName}>{option.label}</span>
                        </span>
                        <span style={{ ...styles.radioOuter, ...(isActive ? styles.radioOuterActive : {}) }}>
                          {isActive ? <span style={styles.radioInner} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Chi tiết thanh toán</h2>
                </div>
                <div style={styles.summaryRows}>
                  <p style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Tổng tiền hàng</span>
                    <span style={styles.summaryValue}>{formatPrice(itemTotal)}</span>
                  </p>
                  <p style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Phí vận chuyển</span>
                    <span style={styles.summaryValue}>{formatPrice(shippingFee)}</span>
                  </p>
                  <p style={styles.summaryRow}>
                    <span style={styles.summaryPromo}>Khuyến mãi</span>
                    <span style={styles.summaryPromo}>-{formatPrice(promoValue)}</span>
                  </p>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <div style={styles.bottomBar}>
        <div style={styles.bottomBarInner}>
          <p style={styles.payRow}>
            <span style={styles.payLabel}>Tổng thanh toán</span>
            <span style={styles.payValue}>{formatPrice(grandTotal)}</span>
          </p>
          <button type="button" style={styles.orderButton} onClick={() => void handlePlaceOrder()} disabled={placingOrder || loading || !cart}>
            {placingOrder ? "Đang xử lý..." : "Đặt Hàng Ngay"}
          </button>
          {message ? <p style={styles.infoText}>{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
