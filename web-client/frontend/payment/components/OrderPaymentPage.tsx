"use client";

import Link from "next/link";
import { compose, withAuth, withErrorBoundary } from "@/lib/decorators";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PaymentStrategyRegistry } from "@/lib/strategy";
import { useAuthStore } from "@/lib/stores/authStore";
import { UrlDirector } from "@/lib";
import {
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "unknown";
type OrderPaymentMethod = "cod" | "momo" | "vnpay" | "bank_transfer" | "unknown";

type OrderDetailResponse = {
  order_id: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: OrderPaymentMethod;
  total_amount: number;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    margin: "0 auto",
    background: "#FFFFFF",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minHeight: "72px",
    padding: `16px ${SCREEN_HEADER_PADDING_X}`,
    borderBottom: "1px solid #E5E7EB",
    background: "#FFFFFF",
  },
  backLink: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1F2937",
    textDecoration: "none",
  },
  headerTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: "28px",
    fontWeight: 700,
    color: "#111827",
  },
  body: {
    flex: 1,
    padding: `20px ${SCREEN_CONTENT_PADDING_X} 124px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    borderRadius: "16px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#111827",
  },
  row: {
    margin: 0,
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "14px",
    lineHeight: "20px",
    color: "#4B5563",
  },
  total: {
    margin: 0,
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "18px",
    lineHeight: "28px",
    fontWeight: 700,
    color: "#059669",
    borderTop: "1px solid #F3F4F6",
    paddingTop: "8px",
  },
  statusPending: {
    color: "#CA8A04",
    background: "#FEF9C3",
    borderRadius: "999px",
    padding: "4px 10px",
    width: "fit-content",
    fontSize: "12px",
    fontWeight: 600,
  },
  statusPaid: {
    color: "#059669",
    background: "#D1FAE5",
    borderRadius: "999px",
    padding: "4px 10px",
    width: "fit-content",
    fontSize: "12px",
    fontWeight: 600,
  },
  infoText: {
    margin: 0,
    textAlign: "center",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: "20px",
  },
  errorText: {
    margin: 0,
    textAlign: "center",
    color: "#B91C1C",
    fontSize: "14px",
    lineHeight: "20px",
  },
  bottomBar: {
    position: "sticky",
    bottom: 0,
    borderTop: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: `12px ${SCREEN_CONTENT_PADDING_X} 20px`,
  },
  actionBtn: {
    width: "100%",
    height: "50px",
    borderRadius: "12px",
    border: "1px solid #4EA96A",
    background: "#4EA96A",
    color: "#FFFFFF",
    fontSize: "15px",
    lineHeight: "24px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0px 10px 15px -3px rgba(16, 185, 129, 0.3), 0px 4px 6px -4px rgba(16, 185, 129, 0.3)",
  },
};


function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function getMethodLabel(method: OrderPaymentMethod): string {
  try {
    return PaymentStrategyRegistry.getStrategy(method).getMethod().displayName;
  } catch {
    if (method === "bank_transfer") {
      return "Chuyển khoản";
    }
  }

  return "Không xác định";
}

function OrderPaymentPageBase() {

  const paymentMethods = useMemo(() => {
  return PaymentStrategyRegistry.getAvailableMethods();
}, []);

  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetailResponse | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<OrderPaymentMethod>("unknown");


  useEffect(() => {
    if (!user?.user_id) {
      return;
    }

    const orderId = String(params?.orderId ?? "").trim();
    if (!orderId) {
      setError("Không tìm thấy mã đơn hàng.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          UrlDirector.create("/api/orders")
            .segment(orderId)
            .query("userId", user.user_id)
            .build(),
          {
            signal: controller.signal,
          },
        );

        const data = (await response.json()) as OrderDetailResponse | { error?: string };
        if (!response.ok) {
          const msg = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(msg || "Không thể tải thông tin thanh toán.");
        }

        setDetail(data as OrderDetailResponse);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setDetail(null);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải thông tin thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    void loadDetail();

    return () => {
      controller.abort();
    };
  }, [params?.orderId, router, user?.user_id]);

  useEffect(() => {
    if (!detail?.payment_method) {
      return;
    }

    if (PaymentStrategyRegistry.hasStrategy(detail.payment_method)) {
      setSelectedMethod(detail.payment_method);
      return;
    }

    setSelectedMethod((paymentMethods[0]?.id as OrderPaymentMethod | undefined) ?? "unknown");
  }, [detail, paymentMethods]);

  const canPay = useMemo(() => {
    if (!detail) {
      return false;
    }

    return detail.order_status !== "cancelled" && detail.payment_status !== "paid" && detail.payment_status !== "cancelled";
  }, [detail]);

  const paymentStatusLabel = useMemo(() => {
    if (!detail) {
      return "Không xác định";
    }

    if (detail.payment_status === "paid") {
      return "Đã thanh toán";
    }

    if (detail.payment_status === "cancelled") {
      return "Đã hủy thanh toán";
    }

    if (detail.payment_status === "failed") {
      return "Thanh toán lỗi";
    }

    return "Chưa thanh toán";
  }, [detail]);

  const handlePay = async () => {
  if (!user?.user_id || !detail || !canPay) {
    return;
  }

  setPaying(true);
  setMessage(null);

  console.log("selectedMethod =", selectedMethod);
  console.log("available methods =", paymentMethods); 

  try {
    const strategy = PaymentStrategyRegistry.getStrategy(selectedMethod);
    const canProcessPayment = await strategy.validate({
      amount: detail.total_amount,
      currency: "VND",
      orderId: detail.order_id,
      userId: user.user_id,
      customerEmail: user?.email,
      customerPhone: user?.phone ?? undefined,
    });

    if (!canProcessPayment) {
      setMessage("Phương thức thanh toán đã chọn chưa đủ điều kiện xử lý.");
      return;
    }

    const result = await strategy.process({
      amount: detail.total_amount,
      currency: "VND",
      orderId: detail.order_id,
      userId: user.user_id,
      customerEmail: user?.email,
      customerPhone: user?.phone ?? undefined,
    });

    if (result.success && !result.redirectUrl) {
      setMessage(result.message || "Thanh toán thành công.");
      if (result.success) {
  const refreshed = await fetch(
    UrlDirector.create("/api/orders")
      .segment(detail.order_id)
      .query("userId", user.user_id)
      .build()
  );

  const updated = await refreshed.json();
  setDetail(updated);
}
      router.replace(
        UrlDirector.create("/orders")
          .segment(detail.order_id)
          .build()
      );

      return;
    }

    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }

    setMessage(result.message || "Không thể xử lý thanh toán.");
  } catch (requestError) {
    setMessage(
      requestError instanceof Error
        ? requestError.message
        : "Không thể thanh toán đơn hàng."
    );
  } finally {
    setPaying(false);
  }
};

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link href={detail ? `/orders/${encodeURIComponent(detail.order_id)}` : "/orders"} style={styles.backLink} aria-label="Quay lại chi tiết đơn hàng">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.headerTitle}>Thanh toán đơn hàng</h1>
        </header>

        <main style={styles.body}>
          {loading && <p style={styles.infoText}>Đang tải thông tin đơn hàng...</p>}
          {!loading && error && <p style={styles.errorText}>{error}</p>}

          {!loading && !error && detail && (
            <section style={styles.card}>
              <p style={styles.title}>Đơn #{detail.order_id.slice(0, 8).toUpperCase()}</p>
              <p style={styles.row}>
                <span>Phương thức</span>
                <span>{getMethodLabel(detail.payment_method)}</span>
              </p>
              <p style={styles.row}>
                <span>Trạng thái</span>
                <span style={detail?.payment_status === "paid" ? styles.statusPaid : styles.statusPending}>
                  {paymentStatusLabel}
                </span>
              </p>
              <p style={styles.total}>
                <span>Tổng thanh toán</span>
                <span>{formatPrice(detail.total_amount)}</span>
              </p>
            </section>
          )}

          {message ? <p style={styles.infoText}>{message}</p> : null}
        </main>

          {detail && (
  <section style={styles.card}>
    <p style={styles.title}>Chọn phương thức thanh toán</p>

    {paymentMethods.map((method) => {
      const isSelected = selectedMethod === method.id;

      return (
        <button
          key={method.id}
          type="button"
          onClick={() => {
  console.log("switching to:", method.id);
  setSelectedMethod(method.id as OrderPaymentMethod);
}}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: isSelected ? "2px solid #4EA96A" : "1px solid #E5E7EB",
            background: isSelected ? "#ECFDF5" : "#FFFFFF",
            marginBottom: "8px",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {method.icon} {method.displayName}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>
            {method.description}
          </div>
        </button>
      );
    })}
  </section>
)}

        {!loading && detail && (
          <div style={styles.bottomBar}>
            <button type="button" style={styles.actionBtn} onClick={() => void handlePay()} disabled={!canPay || paying}>
              {paying ? "Đang xử lý..." : canPay ? "Thanh toán ngay" : detail.payment_status === "paid" ? "Đã thanh toán" : "Không thể thanh toán"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default compose(
  withErrorBoundary,
  (Component) => withAuth(Component, "customer")
)(OrderPaymentPageBase);
