"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type SubscriptionItem = {
  subscriptionId: string;
  userId: string;
  productId: string;
  schedule: string;
  status: string;
  startDate: string;
  nextDeliveryPreview: string;
};

type SubscriptionListResponse = {
  subscriptions: SubscriptionItem[];
};

type ProductOption = {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
  isAvailable: boolean;
};

type ProductsResponse = {
  items: ProductOption[];
};

type SubscriptionStatus = "active" | "paused" | "cancelled";
type ScheduleValue = "weekly" | "monthly";

const SCHEDULE_OPTIONS: Array<{ value: ScheduleValue; label: string; description: string }> = [
  { value: "weekly", label: "Hàng tuần", description: "Giao mỗi 7 ngày" },
  { value: "monthly", label: "Hàng tháng", description: "Giao mỗi 30 ngày" },
];

const STATUS_OPTIONS: Array<{ value: SubscriptionStatus; label: string }> = [
  { value: "active", label: "Đang hoạt động" },
  { value: "paused", label: "Tạm dừng" },
  { value: "cancelled", label: "Đã hủy" },
];

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    margin: "0 auto",
    background: "#FFFFFF",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    minHeight: "56px",
    flexShrink: 0,
    borderBottom: "1px solid #F3F4F6",
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
  title: {
    margin: 0,
    fontSize: "20px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#1E1E1E",
    textTransform: "capitalize",
  },
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 132px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  banner: {
    borderRadius: "16px",
    background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)",
    border: "1px solid #BBF7D0",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  bannerTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "22px",
    fontWeight: 700,
    color: "#1A4331",
  },
  bannerText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#166534",
  },
  bannerButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#51B788",
    color: "#FFFFFF",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
    border: "none",
  },
  card: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "22px",
    fontWeight: 700,
    color: "#1A4331",
  },
  hint: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#6B7280",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    fontFamily: "inherit",
    background: "#FFFFFF",
  },
  select: {
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    fontFamily: "inherit",
    background: "#FFFFFF",
  },
  buttonRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  primaryButton: {
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#51B788",
    color: "#FFFFFF",
    border: "none",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#FFFFFF",
    color: "#1F2937",
    border: "1px solid #D1D5DB",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  destructiveButton: {
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#FEF2F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  infoText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    color: "#6B7280",
    textAlign: "center" as const,
    padding: "10px 0",
  },
  errorText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    color: "#B91C1C",
    textAlign: "center" as const,
    padding: "10px 0",
  },
  messageText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    color: "#166534",
    textAlign: "center" as const,
    padding: "10px 0",
  },
  filterRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterButton: {
    borderRadius: "9999px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
  },
  filterButtonActive: {
    borderColor: "#51B788",
    background: "#ECFDF5",
    color: "#166534",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  itemCard: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  itemTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  productRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    minWidth: "220px",
  },
  thumbnail: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    background: "#F3F4F6",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: 700,
    objectFit: "cover",
    flexShrink: 0,
  },
  productTitle: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "22px",
    fontWeight: 700,
    color: "#111827",
  },
  productMeta: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#6B7280",
  },
  statusBadge: {
    borderRadius: "9999px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  detailRow: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#4B5563",
  },
  detailLabel: {
    fontWeight: 700,
    color: "#111827",
  },
  editBox: {
    borderTop: "1px solid #F3F4F6",
    paddingTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  editGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  scheduleOption: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#FAFAFA",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  scheduleOptionActive: {
    borderColor: "#51B788",
    background: "#ECFDF5",
  },
  scheduleLabel: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#111827",
  },
  scheduleDescription: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  smallNote: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6B7280",
  },
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatSchedule(value: string): string {
  if (value === "monthly") {
    return "Hàng tháng";
  }

  return "Hàng tuần";
}

function getWeekdayLabelFromDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = date.getDay();
  if (day === 0) {
    return "Chủ nhật";
  }

  return `Thứ ${day + 1}`;
}

function formatStatus(value: string): string {
  if (value === "active") {
    return "Đang hoạt động";
  }

  if (value === "paused") {
    return "Tạm dừng";
  }

  return "Đã hủy";
}

function statusBadgeStyle(value: string): CSSProperties {
  if (value === "active") {
    return { background: "#ECFDF5", borderColor: "#A7F3D0", color: "#166534" };
  }

  if (value === "paused") {
    return { background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8" };
  }

  return { background: "#F3F4F6", borderColor: "#D1D5DB", color: "#4B5563" };
}

export default function SubscriptionsManagementPage() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [frequency, setFrequency] = useState<ScheduleValue>("weekly");
  const [filterStatus, setFilterStatus] = useState<"all" | SubscriptionStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState<ScheduleValue>("weekly");
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>("active");
  const [editStartDate, setEditStartDate] = useState("");

  const productMap = useMemo(() => new Map(products.map((item) => [item.productId, item])), [products]);

  const filteredSubscriptions = useMemo(() => {
    if (filterStatus === "all") {
      return subscriptions;
    }

    return subscriptions.filter((item) => item.status === filterStatus);
  }, [filterStatus, subscriptions]);

  const activeSubscriptionsCount = useMemo(() => subscriptions.filter((item) => item.status !== "cancelled").length, [subscriptions]);

  const loadData = async (signal?: AbortSignal) => {
    if (!user?.user_id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [productResponse, subscriptionResponse] = await Promise.all([
        fetch("/api/products?limit=100", { signal }),
        fetch(`/api/subscriptions?userId=${encodeURIComponent(user.user_id)}`, { signal }),
      ]);

      const productData = (await productResponse.json()) as ProductsResponse | { error?: string };
      const subscriptionData = (await subscriptionResponse.json()) as SubscriptionListResponse | { error?: string };

      if (!productResponse.ok) {
        throw new Error("error" in productData ? productData.error ?? "Không thể tải danh sách sản phẩm." : "Không thể tải danh sách sản phẩm.");
      }

      if (!subscriptionResponse.ok) {
        throw new Error("error" in subscriptionData ? subscriptionData.error ?? "Không thể tải danh sách đơn định kỳ." : "Không thể tải danh sách đơn định kỳ.");
      }

      const nextProducts = ((productData as ProductsResponse).items ?? []).filter((item) => item.isAvailable);
      setProducts(nextProducts);

      if (nextProducts.length > 0) {
        setProductId((current) => current || nextProducts[0].productId);
      }

      setSubscriptions((subscriptionData as SubscriptionListResponse).subscriptions ?? []);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }

      setProducts([]);
      setSubscriptions([]);
      setError(requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    void loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, router, user]);

  const handleCreate = async () => {
    if (!user?.user_id || !productId) {
      setError("Vui lòng chọn sản phẩm để tạo đơn định kỳ.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          productId,
          frequency,
        }),
      });

      const data = (await response.json()) as SubscriptionItem | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error ?? "Không thể tạo đơn định kỳ." : "Không thể tạo đơn định kỳ.");
      }

      setMessage("Đã tạo đơn đặt định kỳ mới.");
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tạo đơn định kỳ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (item: SubscriptionItem) => {
    setEditingId(item.subscriptionId);
    setEditSchedule(item.schedule === "monthly" ? "monthly" : "weekly");
    setEditStatus(item.status === "paused" ? "paused" : item.status === "cancelled" ? "cancelled" : "active");
    setEditStartDate(item.startDate);
  };

  const handleSaveEdit = async (item: SubscriptionItem) => {
    if (!user?.user_id) {
      return;
    }

    setUpdatingId(item.subscriptionId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          subscriptionId: item.subscriptionId,
          schedule: editSchedule,
          status: editStatus,
          startDate: editStartDate,
        }),
      });

      const data = (await response.json()) as SubscriptionItem | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error ?? "Không thể cập nhật đơn định kỳ." : "Không thể cập nhật đơn định kỳ.");
      }

      setMessage("Đã cập nhật đơn đặt định kỳ.");
      setEditingId(null);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật đơn định kỳ.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (item: SubscriptionItem) => {
    if (!user?.user_id) {
      return;
    }

    setDeletingId(item.subscriptionId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          subscriptionId: item.subscriptionId,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Không thể hủy đơn định kỳ.");
      }

      setMessage("Đã hủy đơn đặt định kỳ.");
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể hủy đơn định kỳ.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!initialized) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <main style={styles.mainContent}>
            <p style={styles.infoText}>Đang kiểm tra phiên đăng nhập...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href="/orders" style={styles.backLink} aria-label="Quay lại đơn hàng">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.title}>Quản lý đơn đặt định kỳ</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          <section style={styles.banner}>
            <div>
              <p style={styles.bannerTitle}>Đơn đặt định kỳ của bạn</p>
              <p style={styles.bannerText}>
                Theo dõi, chỉnh lịch giao, tạm dừng hoặc hủy bất kỳ đơn định kỳ nào trong một màn hình.
              </p>
            </div>
            <Link href="/orders" style={styles.bannerButton}>
              Về đơn hàng
            </Link>
          </section>

          <section style={styles.card}>
            <div>
              <h2 style={styles.sectionTitle}>Tạo đơn định kỳ mới</h2>
              <p style={styles.hint}>Chọn sản phẩm và tần suất giao hàng cho đơn đặt định kỳ.</p>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label htmlFor="subscription-product" style={styles.label}>
                  Sản phẩm
                </label>
                <select
                  id="subscription-product"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  style={styles.select}
                  disabled={submitting || products.length === 0}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="subscription-frequency" style={styles.label}>
                  Tần suất
                </label>
                <select
                  id="subscription-frequency"
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value as ScheduleValue)}
                  style={styles.select}
                  disabled={submitting}
                >
                  {SCHEDULE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button
                type="button"
                style={{ ...styles.primaryButton, opacity: submitting || !productId ? 0.6 : 1 }}
                onClick={() => void handleCreate()}
                disabled={submitting || !productId}
              >
                {submitting ? "Đang tạo..." : "Tạo đơn định kỳ"}
              </button>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.footerRow}>
              <div>
                <h2 style={styles.sectionTitle}>Danh sách đơn định kỳ</h2>
                <p style={styles.hint}>{activeSubscriptionsCount} đơn đang hoạt động hoặc tạm dừng.</p>
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.secondaryButton} onClick={() => void loadData()} disabled={loading}>
                  {loading ? "Đang tải..." : "Làm mới"}
                </button>
              </div>
            </div>

            <div style={styles.filterRow}>
              {[
                { value: "all", label: "Tất cả" },
                { value: "active", label: "Đang hoạt động" },
                { value: "paused", label: "Tạm dừng" },
                { value: "cancelled", label: "Đã hủy" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  style={{
                    ...styles.filterButton,
                    ...(filterStatus === item.value ? styles.filterButtonActive : {}),
                  }}
                  onClick={() => setFilterStatus(item.value as typeof filterStatus)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loading ? (
              <p style={styles.infoText}>Đang tải danh sách đơn định kỳ...</p>
            ) : error ? (
              <p style={styles.errorText}>{error}</p>
            ) : message ? (
              <p style={styles.messageText}>{message}</p>
            ) : filteredSubscriptions.length === 0 ? (
              <p style={styles.infoText}>Chưa có đơn đặt định kỳ nào.</p>
            ) : (
              <div style={styles.list}>
                {filteredSubscriptions.map((item) => {
                  const product = productMap.get(item.productId);
                  const isEditing = editingId === item.subscriptionId;
                  const isBusy = updatingId === item.subscriptionId || deletingId === item.subscriptionId;

                  return (
                    <article key={item.subscriptionId} style={styles.itemCard}>
                      <div style={styles.itemTop}>
                        <div style={styles.productRow}>
                          {product?.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} style={styles.thumbnail} />
                          ) : (
                            <div style={styles.thumbnail}>GP</div>
                          )}
                          <div style={{ flex: 1 }}>
                            <p style={styles.productTitle}>{product?.name ?? "Sản phẩm không còn trong danh mục"}</p>
                            <p style={styles.productMeta}>#{item.subscriptionId.slice(0, 8).toUpperCase()}</p>
                            <p style={styles.productMeta}>
                              <Link href={`/product-detail/${item.productId}`} style={{ color: "#2563EB", textDecoration: "none" }}>
                                Xem sản phẩm
                              </Link>
                            </p>
                          </div>
                        </div>

                        <span style={{ ...styles.statusBadge, ...statusBadgeStyle(item.status) }}>{formatStatus(item.status)}</span>
                      </div>

                      <div style={styles.detailGrid}>
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Tần suất:</span> {formatSchedule(item.schedule)}
                        </p>
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Bắt đầu:</span> {formatDate(item.startDate)}
                        </p>
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Lần giao tiếp theo:</span> {item.nextDeliveryPreview}
                        </p>
                        {item.schedule === "weekly" ? (
                          <p style={styles.detailRow}>
                            <span style={styles.detailLabel}>Ngày giao hàng tuần:</span> {getWeekdayLabelFromDate(item.startDate)}
                          </p>
                        ) : null}
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Sản phẩm:</span> {item.productId.slice(0, 8).toUpperCase()}
                        </p>
                      </div>

                      {isEditing ? (
                        <div style={styles.editBox}>
                          <div style={styles.editGrid}>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Tần suất</label>
                              <select
                                value={editSchedule}
                                onChange={(event) => setEditSchedule(event.target.value as ScheduleValue)}
                                style={styles.select}
                                disabled={isBusy}
                              >
                                {SCHEDULE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={styles.formGroup}>
                              <label style={styles.label}>Ngày bắt đầu</label>
                              <input
                                type="date"
                                value={editStartDate}
                                onChange={(event) => setEditStartDate(event.target.value)}
                                style={styles.input}
                                disabled={isBusy}
                              />
                              {editSchedule === "weekly" ? (
                                <p style={styles.smallNote}>Lịch tuần hiện tại: {getWeekdayLabelFromDate(editStartDate)}</p>
                              ) : null}
                            </div>

                            <div style={styles.formGroup}>
                              <label style={styles.label}>Trạng thái</label>
                              <select
                                value={editStatus}
                                onChange={(event) => setEditStatus(event.target.value as SubscriptionStatus)}
                                style={styles.select}
                                disabled={isBusy}
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div style={styles.buttonRow}>
                            <button
                              type="button"
                              style={{ ...styles.primaryButton, opacity: isBusy ? 0.6 : 1 }}
                              onClick={() => void handleSaveEdit(item)}
                              disabled={isBusy}
                            >
                              {updatingId === item.subscriptionId ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                            <button
                              type="button"
                              style={styles.secondaryButton}
                              onClick={() => setEditingId(null)}
                              disabled={isBusy}
                            >
                              Hủy chỉnh sửa
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.buttonRow}>
                          <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() => handleStartEdit(item)}
                            disabled={isBusy}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            style={styles.destructiveButton}
                            onClick={() => void handleDelete(item)}
                            disabled={isBusy}
                          >
                            {deletingId === item.subscriptionId ? "Đang hủy..." : "Hủy đơn"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
