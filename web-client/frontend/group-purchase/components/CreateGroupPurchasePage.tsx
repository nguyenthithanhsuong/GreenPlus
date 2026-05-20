"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import NavigationBar from "../../dashboard/components/NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type Product = {
  product_id: string;
  name: string;
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
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#1E1E1E",
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
    padding: `20px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  section: {
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
    fontWeight: 700,
    color: "#1A4331",
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
  },
  select: {
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    fontFamily: "inherit",
  },
  hint: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: "18px",
  },
  messageSuccess: {
    margin: 0,
    padding: "12px",
    borderRadius: "12px",
    background: "#ECFDF5",
    color: "#065F46",
    fontSize: "14px",
  },
  messageError: {
    margin: 0,
    padding: "12px",
    borderRadius: "12px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  button: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#51B788",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonSecondary: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#1F2937",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  loading: {
    margin: 0,
    fontSize: "14px",
    color: "#6B7280",
    textAlign: "center" as const,
  },
};

export default function CreateGroupPurchasePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productId, setProductId] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("10");
  const [minQuantity, setMinQuantity] = useState("5");
  const [discountPrice, setDiscountPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const authUser = useAuthStore((state) => state.user);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/products?limit=100");
        const data = (await response.json()) as { items?: Product[] };
        const productList = data.items ?? [];
        setProducts(productList);
        if (productList.length > 0 && !productId) {
          setProductId(productList[0].product_id);
        }
      } catch {
        setMessage({ type: "error", text: "Không thể tải danh sách sản phẩm." });
      } finally {
        setLoadingProducts(false);
      }
    };

    void loadData();
  }, []);
  useEffect(() => {
    if (!deadline) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      const iso = tomorrow.toISOString().slice(0, 16);
      setDeadline(iso);
    }
  }, [deadline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authUser?.user_id) {
      setMessage({ type: "error", text: "Vui lòng đăng nhập để tạo nhóm mua chung." });
      return;
    }

    if (!productId || !targetQuantity || !minQuantity || !deadline) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin bắt buộc." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/group-purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          userId: authUser.user_id,
          productId,
          targetQuantity: Number(targetQuantity),
          minQuantity: Number(minQuantity),
          discountPrice: discountPrice.trim() ? Number(discountPrice) : undefined,
          deadline: new Date(deadline).toISOString(),
        }),
      });

      const data = (await response.json()) as { group_id?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo nhóm mua chung.");
      }

      setMessage({ type: "success", text: "✓ Tạo nhóm mua chung thành công!" });

      setTimeout(() => {
        const groupId = data.group_id ?? productId;
        router.push(`/product-detail/${productId}`);
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Không thể tạo nhóm mua chung.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <button
            type="button"
            style={styles.backLink}
            onClick={handleCancel}
            aria-label="Quay lại"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 style={styles.title}>Tạo nhóm mua chung</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          {!authUser?.user_id ? (
            <div style={styles.section}>
              <div style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#FEE2E2",
                color: "#B91C1C",
                textAlign: "center" as const,
              }}>
                <p style={{ margin: 0, marginBottom: "8px" }}>Bạn cần đăng nhập để tạo nhóm mua chung</p>
                <Link href="/login" style={{
                  color: "#B91C1C",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}>
                  → Đi đến đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Thông tin nhóm mua chung</h2>
              <p style={styles.hint}>Nhập thông tin để tạo một nhóm mua chung mới.</p>

              <form onSubmit={(e) => void handleSubmit(e)}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="product">
                  Sản phẩm *
                </label>
                {loadingProducts ? (
                  <p style={styles.loading}>Đang tải sản phẩm...</p>
                ) : (
                  <select
                    id="product"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    style={styles.select}
                    disabled={submitting}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="targetQuantity">
                  Số lượng mục tiêu *
                </label>
                <input
                  id="targetQuantity"
                  type="number"
                  min="1"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(e.target.value)}
                  style={styles.input}
                  disabled={submitting}
                  placeholder="Ví dụ: 10"
                />
                <p style={styles.hint}>Số lượng cần đạt để hoàn thành đơn hàng</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="minQuantity">
                  Số lượng tối thiểu *
                </label>
                <input
                  id="minQuantity"
                  type="number"
                  min="1"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  style={styles.input}
                  disabled={submitting}
                  placeholder="Ví dụ: 5"
                />
                <p style={styles.hint}>Số lượng tối thiểu để giao hàng</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="discountPrice">
                  Giá ưu đãi (VNĐ)
                </label>
                <input
                  id="discountPrice"
                  type="number"
                  min="0"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  style={styles.input}
                  disabled={submitting}
                  placeholder="Ví dụ: 50000"
                />
                <p style={styles.hint}>Giá ưu đãi nếu đạt số lượng mục tiêu (không bắt buộc)</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="deadline">
                  Hạn chót *
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={styles.input}
                  disabled={submitting}
                />
                <p style={styles.hint}>Thời gian kết thúc nhóm mua chung</p>
              </div>

              {message && (
                <div style={message.type === "success" ? styles.messageSuccess : styles.messageError}>
                  {message.text}
                </div>
              )}

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  style={styles.buttonSecondary}
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    opacity: submitting || !productId ? 0.6 : 1,
                    cursor: submitting || !productId ? "not-allowed" : "pointer",
                  }}
                  disabled={submitting || !productId}
                >
                  {submitting ? "Đang tạo..." : "Tạo nhóm"}
                </button>
              </div>
              </form>
            </div>
          )}
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
