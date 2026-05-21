"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import { compose, withAuth, withErrorBoundary } from "@/lib";
import { FilterBuilder } from "@/lib/builder";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type ComplaintType = "quality" | "damaged" | "missing_items" | "wrong_item" | "late_delivery" | "other";
type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled";

type OrderItem = {
  order_id: string;
  order_date: string;
  status: OrderStatus;
  status_label: string;
  total_amount: number;
};

type OrdersResponse = {
  items: OrderItem[];
};

type ComplaintResponse = {
  complaintId: string;
  userId: string;
  orderId: string;
  type: ComplaintType;
  description: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: string;
  resolvedAt?: string | null;
  rejectReason?: string | null;
};

const COMPLAINT_OPTIONS: Array<{ value: ComplaintType; label: string }> = [
  { value: "quality", label: "Chất lượng sản phẩm" },
  { value: "damaged", label: "Sản phẩm bị hư hỏng" },
  { value: "missing_items", label: "Thiếu sản phẩm" },
  { value: "wrong_item", label: "Giao sai sản phẩm" },
  { value: "late_delivery", label: "Giao hàng trễ" },
  { value: "other", label: "Vấn đề khác" },
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
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    overflowY: "auto",
    background: "#F9FAFB",
  },
  card: {
    borderRadius: "16px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
    color: "#111827",
  },
  helperText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6B7280",
  },
  label: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#4B5563",
    fontWeight: 600,
  },
  select: {
    width: "100%",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    padding: "0 10px",
    fontSize: "14px",
    color: "#111827",
    background: "#FFFFFF",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    padding: "10px",
    fontSize: "14px",
    color: "#111827",
    resize: "vertical" as const,
    boxSizing: "border-box",
  },
  submitBtn: {
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #4EA96A",
    background: "#4EA96A",
    color: "#FFFFFF",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#B91C1C",
  },
  successText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#047857",
  },
  orderMeta: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#111827",
  },
  infoList: {
    margin: 0,
    paddingLeft: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "12px",
    lineHeight: "16px",
    color: "#4B5563",
  },
};

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function toStatus(value: string): OrderStatus {
  if (["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"].includes(value)) {
    return value as OrderStatus;
  }
  return "pending";
}

function BaseComplaints() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<ComplaintType>("quality");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!user?.user_id) {
      return;
    }

    const controller = new AbortController();

    const loadOrders = async () => {
      setLoadingOrders(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders?userId=${encodeURIComponent(user.user_id)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as OrdersResponse | { error?: string };

        if (!response.ok) {
          const msg = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(msg || "Không thể tải danh sách đơn hàng.");
        }

        const filterConfig = new FilterBuilder()
          .addCondition("status", "equals", "completed")
          .build();

        const allOrders = ((data as OrdersResponse).items ?? []).map((item) => ({ ...item, status: toStatus(item.status) }));
        const completedOrders = allOrders.filter((item) =>
          filterConfig.conditions.every((cond) => String(item[cond.field as keyof typeof item]) === String(cond.value))
        );

        setOrders(completedOrders);

        const preferredOrderId = (searchParams.get("orderId") ?? "").trim();
        if (preferredOrderId && completedOrders.some((item) => item.order_id === preferredOrderId)) {
          setOrderId(preferredOrderId);
        } else if (completedOrders.length > 0) {
          setOrderId(completedOrders[0].order_id);
        } else {
          setOrderId("");
        }
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setOrders([]);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách đơn hàng.");
      } finally {
        setLoadingOrders(false);
      }
    };

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [searchParams, user?.user_id]);

  const selectedOrder = useMemo(() => orders.find((item) => item.order_id === orderId) ?? null, [orderId, orders]);

  const handleSubmit = async () => {
    if (!user?.user_id) {
      return;
    }

    const normalizedDescription = description.trim();
    if (!orderId) {
      setError("Vui lòng chọn đơn hàng cần khiếu nại.");
      return;
    }

    if (normalizedDescription.length < 10) {
      setError("Mô tả khiếu nại cần ít nhất 10 ký tự.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          orderId,
          type,
          description: normalizedDescription,
        }),
      });

      const data = (await response.json()) as ComplaintResponse | { error?: string };
      if (!response.ok) {
        throw new Error(String((data as { error?: string }).error ?? "Không thể gửi khiếu nại."));
      }

      const payload = data as ComplaintResponse;
      setSuccess(`Đã tạo khiếu nại #${payload.complaintId.slice(0, 8).toUpperCase()} (${payload.status}).`);
      setDescription("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể gửi khiếu nại.");
    } finally {
      setSubmitting(false);
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

          <div style={{ textAlign: "center" }}>
            <h1 style={styles.headerTitle}>Khiếu nại đơn hàng</h1>
            <p style={styles.headerSub}>Gửi yêu cầu hỗ trợ cho đơn đã giao</p>
          </div>

          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Tạo khiếu nại</h2>
            <p style={styles.helperText}>Chúng tôi sẽ phản hồi theo trạng thái: pending, resolved hoặc rejected.</p>

            {loadingOrders ? <p style={styles.helperText}>Đang tải đơn hàng đã giao...</p> : null}
            {!loadingOrders && orders.length === 0 ? (
              <p style={styles.helperText}>Bạn chưa có đơn hàng hoàn thành để gửi khiếu nại.</p>
            ) : null}

            <label>
              <p style={styles.label}>Đơn hàng</p>
              <select style={styles.select} value={orderId} onChange={(event) => setOrderId(event.target.value)} disabled={loadingOrders || orders.length === 0 || submitting}>
                {orders.map((item) => (
                  <option key={item.order_id} value={item.order_id}>
                    #{item.order_id.slice(0, 8).toUpperCase()} - {formatPrice(item.total_amount)}
                  </option>
                ))}
              </select>
            </label>

            {selectedOrder ? <p style={styles.orderMeta}>Đơn đã đặt: {new Date(selectedOrder.order_date).toLocaleString("vi-VN")}</p> : null}

            <label>
              <p style={styles.label}>Loại khiếu nại</p>
              <select style={styles.select} value={type} onChange={(event) => setType(event.target.value as ComplaintType)} disabled={submitting}>
                {COMPLAINT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <p style={styles.label}>Mô tả chi tiết</p>
              <textarea
                style={styles.textarea}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả vấn đề bạn gặp phải để bộ phận CSKH hỗ trợ nhanh hơn..."
                disabled={submitting}
              />
            </label>

            {error ? <p style={styles.errorText}>{error}</p> : null}
            {success ? <p style={styles.successText}>{success}</p> : null}

            <button type="button" style={styles.submitBtn} onClick={() => void handleSubmit()} disabled={submitting || loadingOrders || orders.length === 0}>
              {submitting ? "Đang gửi..." : "Gửi khiếu nại"}
            </button>
          </section>

          {/* <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Thông tin dữ liệu khiếu nại</h2>
            <ul style={styles.infoList}>
              <li>Khóa chính: complaint_id (uuid), liên kết với users.user_id và orders.order_id.</li>
              <li>Trạng thái hợp lệ: pending, resolved, rejected.</li>
              <li>Mốc thời gian: created_at, resolved_at.</li>
              <li>Lý do từ chối được lưu ở reject_reason khi trạng thái rejected.</li>
            </ul>
          </section> */}
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}

export default compose(
  withErrorBoundary,
  (Component) => withAuth(Component, "user")
)(BaseComplaints);
