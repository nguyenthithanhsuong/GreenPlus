"use client";

import Link from "next/link";
import { compose, withAuth, withErrorBoundary } from "@/lib/decorators";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { CartService, OrderService, type CartResponse } from "@/lib/singleton";
import {
  CartMapper,
  OrderMapper,
  type CartItemUIModel,
} from "@/lib/mapper";
import { PaymentStrategyRegistry, type PaymentMethod } from "@/lib/strategy";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

const DELIVERY_FEE = 15000;
const PROMOTION = 10000;
type CheckoutPaymentMethod = "cod" | "momo" | "vnpay";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
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
  itemActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  quantityControl: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "999px",
    background: "#EAFBF0",
    padding: "6px",
  },
  quantityButton: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "1px solid #B7E3C8",
    background: "#FFFFFF",
    color: "#1A4331",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    minWidth: "32px",
    textAlign: "center",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  removeButton: {
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#B91C1C",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: "12px",
  },
  noteSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    borderTop: "1px solid #F3F4F6",
    paddingTop: "10px",
  },
  noteSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  noteLabel: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "16px",
    fontWeight: 700,
    color: "#4B5563",
  },
  noteSaveButton: {
    border: "1px solid #51B788",
    background: "#51B788",
    color: "#1A4331",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  noteInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    lineHeight: "20px",
    color: "#111827",
    outline: "none",
  },
  noteWrap: {
    borderTop: "1px solid #F3F4F6",
    paddingTop: "16px",
  },
  noteInputCompact: {
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
    boxShadow:
      "0px 10px 15px -3px rgba(16, 185, 129, 0.3), 0px 4px 6px -4px rgba(16, 185, 129, 0.3)",
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

function createNoteDrafts(items: CartItemUIModel[]): Record<string, string> {
  return items.reduce<Record<string, string>>((drafts, item) => {
    drafts[item.id] = item.note ?? "";
    return drafts;
  }, {});
}

function PaymentBase() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("cod");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [savingNoteItemId, setSavingNoteItemId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const availablePaymentMethods = useMemo<PaymentMethod[]>(
    () =>
      PaymentStrategyRegistry.getAvailableMethods().filter((method) =>
        ["cod", "momo", "vnpay"].includes(method.id),
      ),
    [],
  );
  const selectedPaymentStrategy = useMemo(
    () => PaymentStrategyRegistry.getStrategy(paymentMethod),
    [paymentMethod],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadCart = async () => {
      setLoading(true);
      setError(null);

      try {
        const cartData = await CartService.getCart(user.user_id);

        if ((cartData.items ?? []).length === 0) {
          router.replace("/cart");
          return;
        }

        const cartModel = CartMapper.toUIModel(cartData);
        setCart(cartData);
        setNoteDrafts(createNoteDrafts(cartModel.items));
      } catch (requestError) {
        setCart(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải dữ liệu thanh toán.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCart();
  }, [router, user]);

  const cartUIModel = useMemo(
    () => (cart ? CartMapper.toUIModel(cart) : null),
    [cart],
  );
  const itemTotal = useMemo(
    () => Number(cartUIModel?.total ?? 0),
    [cartUIModel],
  );
  const cartItems = useMemo(() => cartUIModel?.items ?? [], [cartUIModel]);
  const cartQuantity = useMemo(
    () => cartUIModel?.itemCount ?? 0,
    [cartUIModel],
  );
  const shippingFee = useMemo(
    () => (itemTotal > 0 ? DELIVERY_FEE : 0),
    [itemTotal],
  );
  const promoValue = useMemo(
    () => (itemTotal > 0 ? PROMOTION : 0),
    [itemTotal],
  );
  const grandTotal = useMemo(
    () => Math.max(itemTotal + shippingFee - promoValue, 0),
    [itemTotal, shippingFee, promoValue],
  );

  useEffect(() => {
    setNoteDrafts(createNoteDrafts(cartItems));
  }, [cartItems]);

  const refreshCart = (nextCart: CartResponse) => {
    const cartModel = CartMapper.toUIModel(nextCart);

    setCart(nextCart);
    setNoteDrafts(createNoteDrafts(cartModel.items));
  };

  const handleChangeQuantity = async (
    item: CartItemUIModel,
    nextQuantity: number,
  ) => {
    if (!user?.user_id) {
      return;
    }

    if (nextQuantity <= 0) {
      await handleRemoveItem(item);
      return;
    }

    setActiveItemId(item.id);

    try {
      const nextCart = await CartService.updateQuantity({
        userId: user.user_id,
        productId: item.productId,
        quantity: nextQuantity,
      });
      refreshCart(nextCart);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể cập nhật số lượng sản phẩm.",
      );
    } finally {
      setActiveItemId(null);
    }
  };

  const handleRemoveItem = async (item: CartItemUIModel) => {
    if (!user?.user_id) {
      return;
    }

    setActiveItemId(item.id);

    try {
      const nextCart = await CartService.removeFromCart({
        userId: user.user_id,
        productId: item.productId,
      });
      refreshCart(nextCart);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể xóa sản phẩm khỏi giỏ hàng.",
      );
    } finally {
      setActiveItemId(null);
    }
  };

  const handleSaveNote = async (item: CartItemUIModel) => {
    if (!user?.user_id) {
      return;
    }

    setSavingNoteItemId(item.id);

    try {
      const nextCart = await CartService.updateNote({
        userId: user.user_id,
        cartItemId: item.id,
        note: (noteDrafts[item.id] ?? "").trim(),
      });
      refreshCart(nextCart);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể lưu ghi chú cho sản phẩm.",
      );
    } finally {
      setSavingNoteItemId(null);
    }
  };

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
      const canProcessPayment = await selectedPaymentStrategy.validate({
        amount: grandTotal,
        currency: "VND",
        orderId: "checkout",
        customerEmail: user.email,
        customerPhone: user.phone ?? undefined,
      });

      if (!canProcessPayment) {
        setMessage("Phương thức thanh toán đã chọn chưa đủ điều kiện xử lý.");
        return;
      }

      const createResult = await OrderService.createOrder({
        userId: user.user_id,
        deliveryAddress,
        deliveryFee: shippingFee,
        note: note.trim(),
        paymentMethod,
      });

      // Apply OrderMapper to get a typed UI model for the created order
      const orderUIModel = OrderMapper.toUIModel(createResult);
      const paymentResult = await selectedPaymentStrategy.process({
        amount: orderUIModel.total,
        currency: "VND",
        orderId: orderUIModel.id,
        customerEmail: user.email,
        customerPhone: user.phone ?? undefined,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.message);
      }

      setMessage(
        `${paymentResult.message} (Đơn #${orderUIModel.id.slice(0, 8).toUpperCase()}).`,
      );

      if (paymentResult.redirectUrl) {
        window.location.href = paymentResult.redirectUrl;
        return;
      }

      router.push("/orders");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tạo đơn hàng.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link
            href="/cart"
            style={styles.backLink}
            aria-label="Quay lại giỏ hàng"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 style={styles.headerTitle}>Thanh Toán</h1>
        </header>

        <main style={styles.scrollBody}>
          {loading && (
            <p style={styles.infoText}>Đang tải thông tin thanh toán...</p>
          )}
          {error && <p style={styles.errorText}>{error}</p>}

          {!loading && cart && (
            <>
              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    style={styles.sectionIcon}
                  >
                    <path
                      d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                  <h2 style={styles.sectionTitle}>Địa chỉ nhận hàng</h2>
                </div>

                <div style={styles.addressRow}>
                  <div>
                    <p style={styles.nameRow}>
                      <span style={styles.nameText}>
                        {user?.name ?? "Người dùng"}
                      </span>
                      <span style={styles.phoneText}>
                        {user?.phone ?? "Chưa cập nhật"}
                      </span>
                    </p>
                    <p style={styles.addressText}>
                      {user?.address ?? "Chưa cập nhật địa chỉ"}
                    </p>
                  </div>
                  <p style={styles.editHint}>Sửa ở Hồ sơ</p>
                </div>
              </section>

              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    style={styles.sectionIcon}
                  >
                    <path d="M3 7h18" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M5 7l1.2-3h11.6L19 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M5 7v13h14V7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="M9 11h6" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <h2 style={styles.sectionTitle}>Chi tiết đơn hàng</h2>
                </div>

                <div style={styles.itemList}>
                  <p style={styles.itemMeta}>
                    Có {cartQuantity} sản phẩm trong giỏ
                  </p>
                  {cartItems.map((item, index) => (
                    <div
                      key={item.id}
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
                      <Link
                        href={`/product-detail/${item.productId}`}
                        style={{ textDecoration: "none" }}
                        aria-label={`Xem chi tiết ${item.productName}`}
                      >
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            style={{ ...styles.itemThumb, cursor: "pointer" }}
                          />
                        ) : (
                          <div
                            style={{
                              ...styles.itemThumbFallback,
                              cursor: "pointer",
                            }}
                          >
                            No img
                          </div>
                        )}
                      </Link>
                      <div style={styles.itemBody}>
                        <Link
                          href={`/product-detail/${item.productId}`}
                          style={{
                            ...styles.itemName,
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          {item.productName}
                        </Link>
                        <p style={styles.itemMeta}>Sản phẩm hữu cơ GreenPlus</p>
                        <div style={styles.itemPriceRow}>
                          <p style={styles.itemPrice}>
                            {formatPrice(Number(item.subtotal))}
                          </p>
                          <p style={styles.itemQty}>x{item.quantity}</p>
                        </div>
                        <div style={styles.noteSection}>
                          <div style={styles.noteSectionHeader}>
                            <p style={styles.noteLabel}>Ghi chú cho món hàng</p>
                            <span style={styles.itemMeta}>
                              Bấm lưu để cập nhật
                            </span>
                          </div>
                          <input
                            type="text"
                            value={noteDrafts[item.id] ?? ""}
                            onChange={(event) =>
                              setNoteDrafts((previous) => ({
                                ...previous,
                                [item.id]: event.target.value,
                              }))
                            }
                            onBlur={() => void handleSaveNote(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleSaveNote(item);
                              }
                            }}
                            style={styles.noteInputCompact}
                            placeholder="Thêm ghi chú cho sản phẩm này"
                            disabled={savingNoteItemId === item.id}
                          />
                          <div style={styles.itemActions}>
                            <div style={styles.quantityControl}>
                              <button
                                type="button"
                                style={styles.quantityButton}
                                onClick={() =>
                                  void handleChangeQuantity(
                                    item,
                                    item.quantity - 1,
                                  )
                                }
                                disabled={activeItemId === item.id}
                                aria-label={`Giảm số lượng ${item.productName}`}
                              >
                                -
                              </button>
                              <span style={styles.quantityValue}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                style={styles.quantityButton}
                                onClick={() =>
                                  void handleChangeQuantity(
                                    item,
                                    item.quantity + 1,
                                  )
                                }
                                disabled={activeItemId === item.id}
                                aria-label={`Tăng số lượng ${item.productName}`}
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              style={styles.removeButton}
                              onClick={() => void handleRemoveItem(item)}
                              disabled={activeItemId === item.id}
                            >
                              Xóa sản phẩm
                            </button>
                          </div>
                          <button
                            type="button"
                            style={styles.noteSaveButton}
                            onClick={() => void handleSaveNote(item)}
                            disabled={savingNoteItemId === item.id}
                          >
                            {savingNoteItemId === item.id
                              ? "Đang lưu..."
                              : "Cập nhật ghi chú"}
                          </button>
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
                    style={styles.noteInputCompact}
                    placeholder="Ghi chú cho cửa hàng (vd: chọn rau non...)"
                  />
                </div>
              </section>

              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Phương thức thanh toán</h2>
                </div>

                <div style={styles.paymentOptions}>
                  {availablePaymentMethods.map((method) => {
                    const isActive = paymentMethod === method.id;
                    const colorMap: Record<string, string> = {
                      cod: "#059669",
                      momo: "#EC4899",
                      vnpay: "#2563EB",
                    };

                    return (
                      <button
                        key={method.id}
                        type="button"
                        style={{
                          ...styles.paymentOption,
                          ...(isActive ? styles.paymentOptionActive : {}),
                        }}
                        onClick={() =>
                          setPaymentMethod(method.id as CheckoutPaymentMethod)
                        }
                      >
                        <span style={styles.paymentLeft}>
                          <span style={styles.paymentIconWrap}>
                            <span
                              style={{
                                fontWeight: 700,
                                color: colorMap[method.id] || "#6B7280",
                                fontSize: "13px",
                              }}
                            >
                              {method.icon || method.id[0].toUpperCase()}
                            </span>
                          </span>
                          <span style={styles.paymentName}>
                            {method.displayName}
                          </span>
                        </span>
                        <span
                          style={{
                            ...styles.radioOuter,
                            ...(isActive ? styles.radioOuterActive : {}),
                          }}
                        >
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
                    <span style={styles.summaryValue}>
                      {formatPrice(itemTotal)}
                    </span>
                  </p>
                  <p style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Phí vận chuyển</span>
                    <span style={styles.summaryValue}>
                      {formatPrice(shippingFee)}
                    </span>
                  </p>
                  <p style={styles.summaryRow}>
                    <span style={styles.summaryPromo}>Khuyến mãi</span>
                    <span style={styles.summaryPromo}>
                      -{formatPrice(promoValue)}
                    </span>
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
          <button
            type="button"
            style={styles.orderButton}
            onClick={() => void handlePlaceOrder()}
            disabled={placingOrder || loading || !cart}
          >
            {placingOrder ? "Đang xử lý..." : "Đặt Hàng Ngay"}
          </button>
          {message ? <p style={styles.infoText}>{message}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default compose(withErrorBoundary, (Component) =>
  withAuth(Component, "customer"),
)(PaymentBase);
