"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "unknown";
type PaymentMethod = "cod" | "momo" | "vnpay" | "bank_transfer" | "unknown";
type ComplaintType = "quality" | "damaged" | "missing_items" | "wrong_item" | "late_delivery" | "other";

type OrderTrackingEntry = {
  tracking_id: string;
  status: string;
  note: string | null;
  created_at: string;
};

type OrderItemDetail = {
  order_item_id: string;
  product_id: string;
  batch_id: string;
  quantity: number;
  price: number;
  product_name: string | null;
  product_image_url: string | null;
};

type OrderDetailResponse = {
  order_id: string;
  user_id: string;
  order_date: string;
  order_status: OrderStatus;
  order_status_label: string;
  shipping_status: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  tracking_history: OrderTrackingEntry[];
  items: OrderItemDetail[];
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  note: string | null;
};

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
  topHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `16px ${SCREEN_HEADER_PADDING_X}`,
    minHeight: "72px",
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
  headerCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  headerTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: "22px",
    fontWeight: 700,
    color: "#111827",
  },
  headerSub: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6B7280",
  },
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 124px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    background: "linear-gradient(0deg, #EFF6FF, #EFF6FF), linear-gradient(0deg, #E5E7EB, #E5E7EB), #FFFFFF",
  },
  loadingText: {
    margin: 0,
    textAlign: "center",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "12px 0",
  },
  errorText: {
    margin: 0,
    textAlign: "center",
    color: "#B91C1C",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "12px 0",
  },
  shipperCard: {
    borderRadius: "16px",
    border: "1px solid #D1FAE5",
    background: "#CFF7D3",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  shipperLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  avatarWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    background: "#FFFFFF",
    border: "2px solid #FFFFFF",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    position: "relative",
    flexShrink: 0,
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    border: "2px solid #FFFFFF",
    background: "#22C55E",
  },
  shipperInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  shipperHint: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: 600,
    letterSpacing: "0.3px",
    textTransform: "uppercase",
    color: "#059669",
  },
  shipperName: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#111827",
  },
  shipperMeta: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#4B5563",
  },
  callBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border: "1px solid #A7F3D0",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#059669",
  },
  sectionCard: {
    borderRadius: "16px",
    background: "#FFFFFF",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
    color: "#111827",
  },
  timelineWrap: {
    position: "relative",
    paddingLeft: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  timelineTrack: {
    position: "absolute",
    left: "11px",
    top: "8px",
    bottom: "8px",
    width: "2px",
    background: "#F3F4F6",
    borderRadius: "999px",
  },
  timelineTrackActive: {
    position: "absolute",
    left: "11px",
    top: "8px",
    width: "2px",
    background: "#10B981",
    borderRadius: "999px",
  },
  timelineItem: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  timelineTitle: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    color: "#111827",
  },
  timelineMeta: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6B7280",
  },
  timelineDotCompleted: {
    position: "absolute",
    left: "-29px",
    top: "2px",
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "#10B981",
    border: "2px solid #10B981",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  },
  timelineDotActive: {
    position: "absolute",
    left: "-29px",
    top: "2px",
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "#D1FAE5",
    border: "2px solid #10B981",
  },
  timelineDotFuture: {
    position: "absolute",
    left: "-29px",
    top: "2px",
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "#FFFFFF",
    border: "2px solid #E5E7EB",
  },
  addressName: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    color: "#111827",
  },
  addressText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "20px",
    color: "#4B5563",
  },
  itemRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  itemThumb: {
    width: "56px",
    height: "56px",
    borderRadius: "8px",
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
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  itemName: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    color: "#111827",
  },
  itemBottom: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  itemQty: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6B7280",
  },
  itemPrice: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    color: "#111827",
  },
  summaryRow: {
    margin: 0,
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "12px",
    lineHeight: "16px",
    color: "#4B5563",
  },
  summaryTotal: {
    margin: 0,
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#059669",
    borderTop: "1px solid #F3F4F6",
    paddingTop: "8px",
  },
  paymentInfo: {
    borderRadius: "12px",
    background: "#F9FAFB",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
  },
  paymentText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#111827",
    fontWeight: 500,
  },
  paymentBadge: {
    borderRadius: "4px",
    padding: "2px 6px",
    fontSize: "10px",
    lineHeight: "15px",
    fontWeight: 600,
    color: "#CA8A04",
    background: "#FEF9C3",
  },
  paymentActionBtn: {
    marginTop: "10px",
    width: "100%",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #4EA96A",
    background: "#4EA96A",
    color: "#FFFFFF",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: 700,
    cursor: "pointer",
  },
  bottomBar: {
    position: "sticky",
    bottom: 0,
    display: "flex",
    gap: "12px",
    padding: `12px ${SCREEN_CONTENT_PADDING_X} 20px`,
    borderTop: "1px solid #E5E7EB",
    background: "#FFFFFF",
    boxShadow: "0px -4px 20px -10px rgba(0, 0, 0, 0.1)",
  },
  actionBtn: {
    flex: 1,
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#F3F4F6",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    cursor: "pointer",
  },
  actionBtnPrimary: {
    background: "#4EA96A",
    color: "#FFFFFF",
    border: "1px solid #4EA96A",
    fontWeight: 700,
    boxShadow: "0px 10px 15px -3px rgba(16, 185, 129, 0.3), 0px 4px 6px -4px rgba(16, 185, 129, 0.3)",
  },
  actionBtnDanger: {
    background: "#FFFFFF",
    color: "#B91C1C",
    border: "1px solid #FCA5A5",
    fontWeight: 700,
  },
  complaintOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 1200,
  },
  complaintModal: {
    width: "100%",
    maxWidth: "420px",
    borderRadius: "16px",
    background: "#FFFFFF",
    boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
  },
  complaintTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#111827",
  },
  complaintHint: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6B7280",
  },
  complaintLabel: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#4B5563",
    fontWeight: 600,
  },
  complaintSelect: {
    width: "100%",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    padding: "0 10px",
    fontSize: "14px",
    color: "#111827",
    background: "#FFFFFF",
  },
  complaintTextarea: {
    width: "100%",
    minHeight: "100px",
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    padding: "10px",
    fontSize: "14px",
    color: "#111827",
    resize: "vertical" as const,
    boxSizing: "border-box",
  },
  complaintActions: {
    display: "flex",
    gap: "10px",
    marginTop: "4px",
  },
};

const COMPLAINT_OPTIONS: Array<{ value: ComplaintType; label: string }> = [
  { value: "quality", label: "Chất lượng sản phẩm" },
  { value: "damaged", label: "Sản phẩm bị hư hỏng" },
  { value: "missing_items", label: "Thiếu sản phẩm" },
  { value: "wrong_item", label: "Giao sai sản phẩm" },
  { value: "late_delivery", label: "Giao hàng trễ" },
  { value: "other", label: "Vấn đề khác" },
];

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

function getMethodLabel(method: PaymentMethod): string {
  if (method === "cod") {
    return "Thanh toán tiền mặt (COD)";
  }
  if (method === "momo") {
    return "Ví MoMo";
  }
  if (method === "vnpay") {
    return "VNPay";
  }
  if (method === "bank_transfer") {
    return "Chuyển khoản";
  }
  return "Chưa rõ phương thức";
}

function getPaymentStatusLabel(status: PaymentStatus): string {
  if (status === "paid") {
    return "Đã thanh toán";
  }
  if (status === "cancelled") {
    return "Đã hủy thanh toán";
  }
  if (status === "failed") {
    return "Thanh toán lỗi";
  }
  if (status === "pending") {
    return "Chưa thanh toán";
  }
  return "Không xác định";
}

function getPaymentBadgeStyle(status: PaymentStatus): React.CSSProperties {
  if (status === "paid") {
    return { color: "#059669", background: "#D1FAE5" };
  }

  if (status === "cancelled") {
    return { color: "#4B5563", background: "#F3F4F6" };
  }

  if (status === "failed") {
    return { color: "#B91C1C", background: "#FEE2E2" };
  }

  if (status === "pending") {
    return { color: "#CA8A04", background: "#FEF9C3" };
  }

  return { color: "#6B7280", background: "#E5E7EB" };
}

const STEP_FLOW: Array<{ key: OrderStatus; label: string; defaultMeta: string }> = [
  { key: "pending", label: "Đơn hàng đã đặt", defaultMeta: "Đơn hàng đã được tiếp nhận" },
  { key: "confirmed", label: "Đã xác nhận", defaultMeta: "Cửa hàng đang chuẩn bị sản phẩm" },
  { key: "preparing", label: "Đang chuẩn bị", defaultMeta: "Đơn hàng đang được đóng gói" },
  { key: "delivering", label: "Đang giao hàng", defaultMeta: "Tài xế đang trên đường đến bạn" },
  { key: "completed", label: "Giao hàng thành công", defaultMeta: "Đơn hàng đã giao thành công" },
];

export default function OrderDetail() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetailResponse | null>(null);
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintType, setComplaintType] = useState<ComplaintType>("quality");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [complaintSaving, setComplaintSaving] = useState(false);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !user?.user_id) {
      router.replace("/login");
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
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}?userId=${encodeURIComponent(user.user_id)}`, {
          signal: controller.signal,
        });

        const data = (await response.json()) as OrderDetailResponse | { error?: string };
        if (!response.ok) {
          const msg = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(msg || "Không thể tải chi tiết đơn hàng.");
        }

        setDetail(data as OrderDetailResponse);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setDetail(null);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải chi tiết đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    void loadDetail();

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, params?.orderId, refreshToken, router, user?.user_id]);

  const itemTotal = useMemo(() => {
    if (!detail) {
      return 0;
    }

    return Math.max(detail.total_amount - detail.delivery_fee, 0);
  }, [detail]);

  const currentStepIndex = useMemo(() => {
    if (!detail) {
      return 0;
    }

    if (detail.order_status === "cancelled") {
      return 0;
    }

    const idx = STEP_FLOW.findIndex((step) => step.key === detail.order_status);
    return idx >= 0 ? idx : 0;
  }, [detail]);

  const timelineRows = useMemo(() => {
    const byStatus = new Map<string, OrderTrackingEntry>();
    (detail?.tracking_history ?? []).forEach((row) => {
      if (!byStatus.has(row.status)) {
        byStatus.set(row.status, row);
      }
    });

    return STEP_FLOW.map((step, index) => {
      const row = byStatus.get(step.key);
      const isCompleted = detail?.order_status === "cancelled" ? false : index < currentStepIndex;
      const isActive = detail?.order_status !== "cancelled" && index === currentStepIndex;

      return {
        key: step.key,
        title: step.label,
        meta: row?.created_at ? `${formatDateTime(row.created_at)}${row.note ? ` • ${row.note}` : ""}` : step.defaultMeta,
        isCompleted,
        isActive,
      };
    });
  }, [currentStepIndex, detail?.order_status, detail?.tracking_history]);

  const activeLineHeight = useMemo(() => {
    if (!detail || detail.order_status === "cancelled") {
      return "0px";
    }

    const base = 24;
    const gap = 58;
    return `${Math.max(base + currentStepIndex * gap, 8)}px`;
  }, [currentStepIndex, detail]);

  const handleCancelOrder = async () => {
    if (!user?.user_id || !detail) {
      return;
    }

    if (!(detail.order_status === "pending" || detail.order_status === "confirmed")) {
      setMessage("Đơn hàng này không thể hủy ở trạng thái hiện tại.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(detail.order_id)}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          note: "Hủy từ màn hình theo dõi đơn hàng",
        }),
      });

      const data = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) {
        throw new Error(String(data.error ?? "Không thể hủy đơn hàng."));
      }

      setMessage("Đơn hàng đã được hủy thành công.");
      setCancelPromptOpen(false);
      setRefreshToken((value) => value + 1);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Không thể hủy đơn hàng.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryAction = () => {
    if (!detail) {
      return;
    }

    const canOpenPayment = detail.payment_status !== "paid" && detail.order_status !== "cancelled";
    if (canOpenPayment) {
      router.push(`/orders/${encodeURIComponent(detail.order_id)}/payment`);
      return;
    }

    router.push("/orders");
  };

  const handleOpenComplaintModal = () => {
    setComplaintError(null);
    setComplaintDescription("");
    setComplaintType("quality");
    setComplaintOpen(true);
  };

  const handleSubmitComplaint = async () => {
    if (!user?.user_id || !detail) {
      return;
    }

    const normalizedDescription = complaintDescription.trim();
    if (normalizedDescription.length < 10) {
      setComplaintError("Mô tả khiếu nại cần ít nhất 10 ký tự.");
      return;
    }

    setComplaintSaving(true);
    setComplaintError(null);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          orderId: detail.order_id,
          type: complaintType,
          description: normalizedDescription,
        }),
      });

      const data = (await response.json()) as { error?: string; complaintId?: string };
      if (!response.ok) {
        throw new Error(String(data.error ?? "Không thể gửi khiếu nại."));
      }

      setComplaintOpen(false);
      setMessage("Đã gửi khiếu nại thành công. Bộ phận CSKH sẽ phản hồi sớm nhất.");
    } catch (requestError) {
      setComplaintError(requestError instanceof Error ? requestError.message : "Không thể gửi khiếu nại.");
    } finally {
      setComplaintSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topHeader}>
          <Link href="/orders" style={styles.backLink} aria-label="Quay lại đơn hàng">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div style={styles.headerCenter}>
            <h1 style={styles.headerTitle}>{detail ? `Mã đơn: #${detail.order_id.slice(0, 8).toUpperCase()}` : "Chi tiết đơn"}</h1>
            <p style={styles.headerSub}>{detail ? `Đặt lúc ${formatDateTime(detail.order_date)}` : ""}</p>
          </div>

          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          {loading && <p style={styles.loadingText}>Đang tải chi tiết đơn hàng...</p>}
          {!loading && error && <p style={styles.errorText}>{error}</p>}

          {!loading && !error && detail && (
            <>
              {detail.order_status === "delivering" && (
                <section style={styles.shipperCard}>
                  <div style={styles.shipperLeft}>
                    <div style={styles.avatarWrap}>
                      <span style={styles.onlineDot} />
                    </div>
                    <div style={styles.shipperInfo}>
                      <p style={styles.shipperHint}>Tài xế đang giao hàng</p>
                      <p style={styles.shipperName}>Nguyễn Văn Shipper</p>
                      <p style={styles.shipperMeta}>59-A1 123.45 • Honda Wave</p>
                    </div>
                  </div>
                  <a href="tel:0900000000" style={styles.callBtn} aria-label="Gọi shipper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6.8 3h2.6c.5 0 1 .3 1.2.8l1.2 2.9c.2.5.1 1-.3 1.4L10 9.6a13.6 13.6 0 0 0 4.4 4.4l1.5-1.5c.4-.4.9-.5 1.4-.3l2.9 1.2c.5.2.8.7.8 1.2V17c0 .8-.6 1.4-1.4 1.5A15.7 15.7 0 0 1 5.5 4.4C5.6 3.6 6.2 3 7 3Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </section>
              )}

              <section style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Tiến độ đơn hàng</h2>
                <div style={styles.timelineWrap}>
                  <span style={styles.timelineTrack} />
                  <span style={{ ...styles.timelineTrackActive, height: activeLineHeight }} />

                  {timelineRows.map((row) => (
                    <div key={row.key} style={styles.timelineItem}>
                      <p
                        style={{
                          ...styles.timelineTitle,
                          color: row.isActive ? "#059669" : row.isCompleted ? "#111827" : "#9CA3AF",
                          fontWeight: row.isActive ? 700 : row.isCompleted ? 600 : 500,
                        }}
                      >
                        {row.title}
                      </p>
                      <p style={{ ...styles.timelineMeta, color: row.isActive ? "#4B5563" : row.isCompleted ? "#6B7280" : "#9CA3AF" }}>{row.meta}</p>

                      {row.isActive ? (
                        <span style={styles.timelineDotActive}>
                          <span
                            style={{
                              display: "block",
                              width: "10px",
                              height: "10px",
                              borderRadius: "999px",
                              background: "#10B981",
                              margin: "5px auto",
                            }}
                          />
                        </span>
                      ) : row.isCompleted ? (
                        <span style={styles.timelineDotCompleted} />
                      ) : (
                        <span style={styles.timelineDotFuture} />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Địa chỉ nhận hàng</h2>
                <p style={styles.addressName}>{`${user?.name ?? "Khách hàng"} • ${user?.phone ?? "---"}`}</p>
                <p style={styles.addressText}>{detail.delivery_address}</p>
              </section>

              <section style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Sản phẩm đã đặt</h2>
                {detail.items.map((item, index) => (
                  <div
                    key={item.order_item_id}
                    style={{
                      ...styles.itemRow,
                      ...(index > 0
                        ? {
                            borderTop: "1px solid #F3F4F6",
                            paddingTop: "12px",
                          }
                        : {}),
                    }}
                  >
                    <div style={styles.itemThumb}>
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name ?? "Sản phẩm"}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                        />
                      ) : (
                        <span>IMG</span>
                      )}
                    </div>
                    <div style={styles.itemBody}>
                      <p style={styles.itemName}>{item.product_name ?? "Sản phẩm"}</p>
                      <div style={styles.itemBottom}>
                        <p style={styles.itemQty}>x{item.quantity}</p>
                        <p style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <section style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Thông tin thanh toán</h2>
                <p style={styles.summaryRow}>
                  <span>Tổng tiền hàng</span>
                  <span>{formatPrice(itemTotal)}</span>
                </p>
                <p style={styles.summaryRow}>
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(detail.delivery_fee)}</span>
                </p>
                <p style={styles.summaryRow}>
                  <span style={{ color: "#059669" }}>Khuyến mãi</span>
                  <span style={{ color: "#059669" }}>-0đ</span>
                </p>
                <p style={styles.summaryTotal}>
                  <span>Thành tiền</span>
                  <span>{formatPrice(detail.total_amount)}</span>
                </p>

                <div style={styles.paymentInfo}>
                  <p style={styles.paymentText}>{getMethodLabel(detail.payment_method)}</p>
                  <span style={{ ...styles.paymentBadge, ...getPaymentBadgeStyle(detail.payment_status) }}>{getPaymentStatusLabel(detail.payment_status)}</span>
                </div>
                {detail.payment_status !== "paid" && detail.order_status !== "cancelled" ? (
                  <button type="button" style={styles.paymentActionBtn} onClick={handlePrimaryAction} disabled={saving}>
                    Thanh toán
                  </button>
                ) : null}
              </section>

              {message ? <p style={styles.loadingText}>{message}</p> : null}
            </>
          )}
        </main>

        {!loading && detail && (
          <div style={styles.bottomBar}>
            <button
              type="button"
              style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
              onClick={handleOpenComplaintModal}
              disabled={saving}
            >
              Khiếu nại
            </button>
            <button
              type="button"
              style={styles.actionBtn}
              onClick={() => setCancelPromptOpen(true)}
              disabled={saving || !(detail.order_status === "pending" || detail.order_status === "confirmed")}
            >
              Hủy đơn hàng
            </button>
            <button
              type="button"
              style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }}
              onClick={handlePrimaryAction}
              disabled={saving}
            >
              {detail.payment_status !== "paid" && detail.order_status !== "cancelled" ? "Thanh toán" : "Quay lại đơn hàng"}
            </button>
          </div>
        )}

        {complaintOpen && detail ? (
          <div
            style={styles.complaintOverlay}
            onClick={() => {
              if (!complaintSaving) {
                setComplaintOpen(false);
              }
            }}
          >
            <section
              style={styles.complaintModal}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <h3 style={styles.complaintTitle}>Gửi khiếu nại đơn hàng</h3>
              <p style={styles.complaintHint}>Đơn #{detail.order_id.slice(0, 8).toUpperCase()}</p>

              <label>
                <p style={styles.complaintLabel}>Loại khiếu nại</p>
                <select
                  style={styles.complaintSelect}
                  value={complaintType}
                  onChange={(event) => setComplaintType(event.target.value as ComplaintType)}
                  disabled={complaintSaving}
                >
                  {COMPLAINT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p style={styles.complaintLabel}>Mô tả chi tiết</p>
                <textarea
                  style={styles.complaintTextarea}
                  placeholder="Mô tả vấn đề bạn gặp phải để chúng tôi hỗ trợ nhanh hơn..."
                  value={complaintDescription}
                  onChange={(event) => setComplaintDescription(event.target.value)}
                  disabled={complaintSaving}
                />
              </label>

              {complaintError ? <p style={{ ...styles.errorText, padding: 0 }}>{complaintError}</p> : null}

              <div style={styles.complaintActions}>
                <button
                  type="button"
                  style={styles.actionBtn}
                  disabled={complaintSaving}
                  onClick={() => {
                    if (!complaintSaving) {
                      setComplaintOpen(false);
                    }
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }}
                  disabled={complaintSaving}
                  onClick={() => void handleSubmitComplaint()}
                >
                  {complaintSaving ? "Đang gửi..." : "Gửi khiếu nại"}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        <ConfirmationDialog
          open={cancelPromptOpen}
          title="Xác nhận hủy đơn hàng"
          message={
            detail
              ? `Bạn có chắc muốn hủy đơn #${detail.order_id.slice(0, 8).toUpperCase()}? Thanh toán của đơn sẽ chuyển sang trạng thái đã hủy.`
              : ""
          }
          confirmLabel="Hủy đơn"
          cancelLabel="Giữ lại"
          confirmTone="danger"
          busy={saving}
          onCancel={() => {
            if (!saving) {
              setCancelPromptOpen(false);
            }
          }}
          onConfirm={() => void handleCancelOrder()}
        />

        <NavigationBar />
      </div>
    </div>
  );
}
