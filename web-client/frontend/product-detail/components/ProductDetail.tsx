"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type DetailSection = "detail" | "nutrition" | "origin";

type ProductBrowseItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  price: number | null;
  isAvailable: boolean;
};

type ProductsResponse = {
  page: number;
  limit: number;
  total: number;
  items: ProductBrowseItem[];
};

type ProductDetailData = {
  productId: string;
  name: string;
  description: string | null;
  images: string[];
  availablePrice: number | null;
  category: {
    id: string | null;
    name: string | null;
  };
  inventory: {
    status: "in_stock" | "out_of_stock" | "expired";
    totalAvailable: number;
    totalReserved: number;
    hasSellableBatch: boolean;
    totalQuantity: number;
  };
  batches: Array<{
    batchId: string;
    status: "available" | "expired" | "sold_out";
    expireDate: string;
    quantity: number;
    available: number;
    reserved: number;
    isSellable: boolean;
  }>;
  supplier: {
    id: string | null;
    certification: string | null;
  };
};

type ReviewItem = {
  reviewId: string;
  userId: string;
  userName: string;
  userImageUrl: string | null;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

type ReviewsResponse = {
  total: number;
  items: ReviewItem[];
};

type ProductReview = {
  id: number;
  name: string;
  date: string;
  rating: number;
  comment: string;
};

type DebugStep = {
  label: string;
  status: "idle" | "loading" | "ok" | "error";
  detail?: string;
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
    height: "48px",
    flexShrink: 0,
  },
  topTitle: {
    margin: 0,
    fontSize: "20px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#1E1E1E",
    textTransform: "capitalize",
  },
  iconButton: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    color: "#1E1E1E",
    textDecoration: "none",
  },
  heroImage: {
    width: "100%",
    aspectRatio: "401 / 301",
    background: "linear-gradient(140deg, #d1fae5 0%, #a7f3d0 55%, #6ee7b7 100%)",
  },
  slider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    marginTop: "10px",
  },
  sliderActive: {
    width: "24px",
    height: "4px",
    borderRadius: "8px",
    background: "#51B788",
  },
  sliderDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#C7C7C7",
  },
  mainContent: {
    flex: 1,
    padding: `12px ${SCREEN_CONTENT_PADDING_X} 126px`,
    display: "flex",
    flexDirection: "column",
    gap: "clamp(16px, 3.8vw, 24px)",
  },
  detailCard: {
    background: "#F9FAFB",
    borderRadius: "16px",
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  detailName: {
    margin: 0,
    fontSize: "clamp(16px, 4.2vw, 18px)",
    fontWeight: 700,
    lineHeight: "24px",
    color: "#1E1E1E",
    flex: 1,
  },
  rating: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1E1E1E",
  },
  detailText: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    color: "#717171",
  },
  quantityRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  quantityButton: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    border: "none",
    background: "transparent",
    color: "#51B788",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 500,
    color: "#062612",
  },
  priceText: {
    margin: 0,
    fontSize: "clamp(20px, 5.4vw, 24px)",
    lineHeight: "28px",
    fontWeight: 700,
    color: "#2E6A50",
  },
  ctaRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  addButton: {
    flex: 1,
    height: "48px",
    border: "none",
    borderRadius: "16px",
    background: "#51B788",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
  },
  favoriteButton: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    border: "1px solid #51B788",
    background: "#FFFFFF",
    color: "#51B788",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  accordionList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  accordionHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    height: "40px",
    borderRadius: "16px",
    border: "none",
    background: "#F9FAFB",
    fontSize: "14px",
    color: "#1E1E1E",
    cursor: "pointer",
  },
  accordionBody: {
    margin: 0,
    padding: "0 16px 8px",
    fontSize: "13px",
    lineHeight: "18px",
    color: "#5B5B5B",
  },
  batchSummaryWrap: {
    padding: "0 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  batchSummaryLine: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#5B5B5B",
  },
  batchList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  batchItem: {
    borderRadius: "10px",
    background: "#F3F4F6",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  batchItemTitle: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  batchItemMeta: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#4B5563",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: "24px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  similarList: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "2px",
  },
  similarCard: {
    background: "#F9FAFB",
    borderRadius: "16px",
    padding: "8px",
    minHeight: "210px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  similarImage: {
    width: "100%",
    height: "92px",
    borderRadius: "12px",
    background: "linear-gradient(140deg, #ecfdf5 0%, #d1fae5 70%, #a7f3d0 100%)",
  },
  similarName: {
    margin: "8px 0 2px",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: "18px",
    color: "#1E1E1E",
  },
  similarMeta: {
    margin: 0,
    fontSize: "12px",
    color: "#1E1E1E",
  },
  similarLink: {
    color: "inherit",
    textDecoration: "none",
  },
  similarFooter: {
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  smallAddBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border: "none",
    background: "#51B788",
    color: "#FFFFFF",
    fontSize: "20px",
    cursor: "pointer",
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  reviewCard: {
    background: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #EFEFEF",
    padding: "8px",
  },
  reviewTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  reviewerBlock: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "32px",
    background: "#D1D5DB",
    objectFit: "cover",
    flexShrink: 0,
  },
  reviewerName: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    color: "#444444",
  },
  reviewDate: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#C7C7C7",
  },
  reviewComment: {
    margin: "8px 0 0",
    fontSize: "12px",
    lineHeight: "16px",
    color: "#5B5B5B",
  },
  moreReviewBtn: {
    border: "none",
    background: "transparent",
    color: "#51B788",
    padding: "8px 0",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
  },
  reviewAvatarFallback: {
    width: "40px",
    height: "40px",
    borderRadius: "32px",
    background: "#D1D5DB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1A4331",
    fontWeight: 700,
    flexShrink: 0,
  },
  debugPanel: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    background: "#F8FAFC",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  debugTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    color: "#0F172A",
  },
  debugItem: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#334155",
    wordBreak: "break-word",
  },
  debugStatus: {
    fontWeight: 700,
  },
};

function buildStars(rating: number): string {
  return `${"★".repeat(rating)}${"☆".repeat(Math.max(0, 5 - rating))}`;
}

function formatBatchStatus(status: "available" | "expired" | "sold_out"): string {
  if (status === "available") {
    return "Sẵn bán";
  }

  if (status === "expired") {
    return "Hết hạn";
  }

  return "Đã bán hết";
}
type ProductDetailProps = {
  productId?: string;
  backHref?: string;
};

function formatPrice(value: number | null): string {
  if (value === null) {
    return "Liên hệ";
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export default function ProductDetail({ productId, backHref }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const routerUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductBrowseItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState<string | null>(null);
  const [cartActionLoading, setCartActionLoading] = useState(false);
  const [cartActionMessage, setCartActionMessage] = useState<string | null>(null);
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([
    { label: "route params", status: productId ? "ok" : "error", detail: productId ? `productId=${productId}` : "Missing productId route param" },
    { label: "product detail fetch", status: "idle" },
    { label: "related products fetch", status: "idle" },
    { label: "reviews fetch", status: "idle" },
  ]);
  const [expanded, setExpanded] = useState<Record<DetailSection, boolean>>({
    detail: false,
    nutrition: false,
    origin: false,
  });

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const updateStep = (label: string, nextStep: Partial<DebugStep>) => {
      setDebugSteps((previous) =>
        previous.map((step) => (step.label === label ? { ...step, ...nextStep } : step)),
      );
    };

    const readResponseText = async (response: Response) => {
      const text = await response.text();
      console.debug("[ProductDetail] response", {
        url: response.url,
        status: response.status,
        ok: response.ok,
        body: text,
      });
      return text;
    };

    const parseJsonResponse = <T,>(text: string): T => JSON.parse(text) as T;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      updateStep("product detail fetch", { status: "loading", detail: `GET /api/products/${productId}` });
      updateStep("related products fetch", { status: "idle", detail: undefined });
      updateStep("reviews fetch", { status: "idle", detail: undefined });

      try {
        const detailResponse = await fetch(`/api/products/${encodeURIComponent(productId)}`, { signal: controller.signal });
        const detailBodyText = await readResponseText(detailResponse);
        const detailData = parseJsonResponse<ProductDetailData | { error?: string }>(detailBodyText);

        if (!detailResponse.ok) {
          const message = typeof detailData === "object" && detailData && "error" in detailData ? String(detailData.error ?? "") : "";
          updateStep("product detail fetch", {
            status: "error",
            detail: `${detailResponse.status} ${message || detailBodyText || "Unknown detail fetch error"}`,
          });
          throw new Error(message || "Không thể tải chi tiết sản phẩm.");
        }

        const resolvedDetail = detailData as ProductDetailData;
        setProduct(resolvedDetail);
        updateStep("product detail fetch", {
          status: "ok",
          detail: `${resolvedDetail.name} | category=${resolvedDetail.category.id ?? "none"} | price=${resolvedDetail.availablePrice ?? "null"}`,
        });

        if (resolvedDetail.category.id) {
          updateStep("related products fetch", {
            status: "loading",
            detail: `GET /api/products?categoryId=${resolvedDetail.category.id}&limit=6`,
          });
          const relatedResponse = await fetch(
            `/api/products?categoryId=${encodeURIComponent(resolvedDetail.category.id)}&sort=newest&limit=6`,
            { signal: controller.signal },
          );
          const relatedBodyText = await readResponseText(relatedResponse);
          const relatedData = parseJsonResponse<ProductsResponse | { error?: string }>(relatedBodyText);

          if (!relatedResponse.ok) {
            const message = typeof relatedData === "object" && relatedData && "error" in relatedData ? String(relatedData.error ?? "") : "";
            updateStep("related products fetch", {
              status: "error",
              detail: `${relatedResponse.status} ${message || relatedBodyText || "Unknown related-products error"}`,
            });
            throw new Error(message || "Không thể tải sản phẩm tương tự.");
          }

          setRelatedProducts((relatedData as ProductsResponse).items.filter((item) => item.productId !== resolvedDetail.productId));
          updateStep("related products fetch", {
            status: "ok",
            detail: `loaded ${(relatedData as ProductsResponse).items.length} products`,
          });
        } else {
          setRelatedProducts([]);
          updateStep("related products fetch", { status: "error", detail: "Missing category.id from product detail backend response" });
        }

        updateStep("reviews fetch", {
          status: "loading",
          detail: `GET /api/reviews?productId=${resolvedDetail.productId}&limit=10`,
        });
        const reviewsResponse = await fetch(`/api/reviews?productId=${encodeURIComponent(resolvedDetail.productId)}&limit=10`, {
          signal: controller.signal,
        });
        const reviewsBodyText = await readResponseText(reviewsResponse);
        const reviewsData = parseJsonResponse<ReviewsResponse | { error?: string }>(reviewsBodyText);

        if (!reviewsResponse.ok) {
          const message = typeof reviewsData === "object" && reviewsData && "error" in reviewsData ? String(reviewsData.error ?? "") : "";
          updateStep("reviews fetch", {
            status: "error",
            detail: `${reviewsResponse.status} ${message || reviewsBodyText || "Unknown reviews error"}`,
          });
          throw new Error(message || "Không thể tải đánh giá sản phẩm.");
        }

        setReviews((reviewsData as ReviewsResponse).items ?? []);
        updateStep("reviews fetch", {
          status: "ok",
          detail: `loaded ${(reviewsData as ReviewsResponse).items?.length ?? 0} reviews`,
        });
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        console.error("[ProductDetail] load failed", {
          productId,
          error: requestError,
          debugSteps,
        });
        setError(requestError instanceof Error ? requestError.message : "Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();

    return () => {
      controller.abort();
    };
  }, [productId]);

  const heroImage = useMemo(() => {
    return product?.images?.[0] ?? null;
  }, [product]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return null;
    }

    const sum = reviews.reduce((total, review) => total + Number(review.rating ?? 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const resolvedName = product?.name ?? null;
  const resolvedDescription = product?.description ?? null;
  const resolvedPrice = product ? formatPrice(product.availablePrice) : null;
  const resolvedStatus = product ? (product.inventory.hasSellableBatch ? "Sẵn hàng" : "Tạm hết") : null;
  const resolvedCategoryName = product?.category.name ?? null;
  const ratingText = averageRating === null ? "0.0" : averageRating.toFixed(1);
  const debugVisible = true;

  const handleAddToCart = async () => {
    setCartActionMessage(null);

    if (!productId) {
      setCartActionMessage("Không xác định được sản phẩm để thêm vào giỏ hàng.");
      return;
    }

    if (!isAuthenticated || !routerUser?.user_id) {
      setCartActionMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    setCartActionLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: routerUser.user_id,
          productId,
          quantity,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Không thể thêm sản phẩm vào giỏ hàng.");
      }

      setCartActionMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (requestError) {
      setCartActionMessage(requestError instanceof Error ? requestError.message : "Không thể thêm sản phẩm vào giỏ hàng.");
    } finally {
      setCartActionLoading(false);
    }
  };

  // If no productId is provided, show an error state
  if (!productId) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.topNav}>
            <Link href="/dashboard" style={styles.iconButton} aria-label="Quay lại">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <h1 style={styles.topTitle}>Chi tiết sản phẩm</h1>
            <div style={{ width: "24px" }} />
          </header>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#1E1E1E", marginBottom: "16px" }}>
                Không tìm thấy sản phẩm
              </p>
              <p style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>
                Vui lòng quay lại và chọn một sản phẩm khác
              </p>
              <Link href="/dashboard" style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#51B788",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
              }}>
                Quay lại Trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href={backHref ?? (product?.category.id ? `/category-products/${product.category.id}?name=${encodeURIComponent(product.category.name ?? "Danh mục")}` : "/dashboard")} style={styles.iconButton} aria-label="Quay lại">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.topTitle}>Chi Tiết Sản Phẩm</h1>
          <div style={{ width: "24px", height: "24px" }} />
        </header>

        {heroImage ? <img src={heroImage} alt={resolvedName ?? "Ảnh sản phẩm"} style={styles.heroImage} /> : <div style={styles.heroImage} />}

        <div style={styles.slider}>
          <div style={styles.sliderActive} />
          <div style={styles.sliderDot} />
          <div style={styles.sliderDot} />
        </div>

        <main style={styles.mainContent}>
          {loading && <p style={{ ...styles.detailText, margin: 0 }}>Đang tải chi tiết sản phẩm...</p>}
          {!loading && error && <p style={{ ...styles.detailText, margin: 0, color: "#B91C1C" }}>{error}</p>}

          {/* {debugVisible && (
            <section style={styles.debugPanel}>
              <p style={styles.debugTitle}>Debug product detail</p>
              {debugSteps.map((step) => (
                <p key={step.label} style={styles.debugItem}>
                  <span style={styles.debugStatus}>[{step.status}]</span> {step.label}
                  {step.detail ? ` - ${step.detail}` : ""}
                </p>
              ))}
            </section>
          )} */}

          <section style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <h2 style={styles.detailName}>{resolvedName ?? (loading ? "Đang tải..." : "Sản phẩm chưa cập nhật")}</h2>
              <p style={styles.rating}>{loading ? "Đang tải" : `★ ${ratingText}`}</p>
            </div>
            <p style={styles.detailText}>{resolvedDescription ?? (loading ? "Đang tải mô tả sản phẩm..." : "Mô tả sản phẩm đang được cập nhật.")}</p>

            <div style={styles.quantityRow}>
              <div style={styles.quantityControl}>
                <button style={styles.quantityButton} onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Giảm số lượng">
                  −
                </button>
                <div style={styles.quantityValue}>{quantity}</div>
                <button style={styles.quantityButton} onClick={() => setQuantity((value) => value + 1)} aria-label="Tăng số lượng">
                  +
                </button>
              </div>

              <p style={styles.priceText}>{resolvedPrice ?? (loading ? "Đang tải..." : "Liên hệ")}</p>
            </div>

            <div style={styles.ctaRow}>
              <button style={styles.addButton} onClick={() => void handleAddToCart()} disabled={cartActionLoading}>
                {cartActionLoading ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>
              <button style={styles.favoriteButton} aria-label="Yêu thích">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                    stroke="#51B788"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {cartActionMessage && <p style={{ ...styles.detailText, margin: 0, fontSize: "13px" }}>{cartActionMessage}</p>}
          </section>

          <section style={styles.accordionList}>
            <button style={styles.accordionHeader} onClick={() => setExpanded((prev) => ({ ...prev, detail: !prev.detail }))}>
              <span>Chi tiết sản phẩm</span>
              <span>{expanded.detail ? "▲" : "▼"}</span>
            </button>
            {expanded.detail && (
              <p style={styles.accordionBody}>
                {resolvedDescription ?? "Thông tin chi tiết sản phẩm đang được cập nhật từ backend."}
              </p>
            )}

            <button style={styles.accordionHeader} onClick={() => setExpanded((prev) => ({ ...prev, nutrition: !prev.nutrition }))}>
              <span>Dinh dưỡng</span>
              <span>{expanded.nutrition ? "▲" : "▼"}</span>
            </button>
            {expanded.nutrition && <p style={styles.accordionBody}>Thông tin dinh dưỡng chưa có trong backend.</p>}

            <button style={styles.accordionHeader} onClick={() => setExpanded((prev) => ({ ...prev, origin: !prev.origin }))}>
              <span>Nguồn gốc</span>
              <span>{expanded.origin ? "▲" : "▼"}</span>
            </button>
            {expanded.origin && (
              <div style={styles.batchSummaryWrap}>
                <p style={styles.batchSummaryLine}>
                  {`Danh mục: ${resolvedCategoryName ?? "Đang cập nhật"}. Chứng nhận: ${product?.supplier.certification ?? "Đang cập nhật"}.`}
                </p>
                <p style={styles.batchSummaryLine}>
                  {`Tổng từ batches: ${product?.inventory.totalQuantity ?? 0}. Khả dụng: ${product?.inventory.totalAvailable ?? 0}. Đang giữ: ${product?.inventory.totalReserved ?? 0}.`}
                </p>

                <div style={styles.batchList}>
                  {(product?.batches ?? []).map((batch) => (
                    <article key={batch.batchId} style={styles.batchItem}>
                      <p style={styles.batchItemTitle}>{`Batch ${batch.batchId.slice(0, 8)}...`}</p>
                      <p style={styles.batchItemMeta}>{`Trạng thái: ${formatBatchStatus(batch.status)} | Có thể bán: ${batch.isSellable ? "Có" : "Không"}`}</p>
                      <p style={styles.batchItemMeta}>{`Số lượng: ${batch.quantity} | Khả dụng: ${batch.available} | Giữ chỗ: ${batch.reserved}`}</p>
                      <p style={styles.batchItemMeta}>{`Hạn dùng: ${new Date(batch.expireDate).toLocaleDateString("vi-VN")}`}</p>
                    </article>
                  ))}

                  {(product?.batches?.length ?? 0) === 0 && (
                    <p style={styles.batchItemMeta}>Chưa có lô hàng nào cho sản phẩm này.</p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section>
            <h3 style={styles.sectionTitle}>Sản phẩm tương tự</h3>
            {!loading && relatedProducts.length === 0 && <p style={styles.reviewComment}>Chưa có sản phẩm tương tự.</p>}
            <div style={styles.similarList}>
              {relatedProducts.slice(0, 3).map((item) => (
                <Link key={item.productId} href={`/product-detail/${item.productId}`} style={styles.similarLink}>
                  <article style={styles.similarCard}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={styles.similarImage} /> : <div style={styles.similarImage} />}
                    <div>
                      <p style={styles.similarName}>{item.name}</p>
                      <p style={styles.similarMeta}>{item.categoryName ?? "Sản phẩm"}</p>
                    </div>
                    <div style={styles.similarFooter}>
                      <p style={{ ...styles.similarMeta, fontWeight: 700 }}>{formatPrice(item.price)}</p>
                      <button style={styles.smallAddBtn}>+</button>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h3 style={styles.sectionTitle}>Đánh giá</h3>
            {reviews.length === 0 && !loading && <p style={styles.reviewComment}>Chưa có đánh giá cho sản phẩm này.</p>}
            <div style={styles.reviewList}>
              {reviews.map((review) => (
                <article key={review.reviewId} style={styles.reviewCard}>
                  <div style={styles.reviewTop}>
                    <div style={styles.reviewerBlock}>
                      {review.userImageUrl ? (
                        <img src={review.userImageUrl} alt={review.userName} style={styles.avatar} />
                      ) : (
                        <div style={styles.reviewAvatarFallback}>{review.userName.slice(0, 1).toUpperCase()}</div>
                      )}
                      <div>
                        <p style={styles.reviewerName}>{review.userName}</p>
                        <p style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                    </div>
                    <div style={styles.rating}>{buildStars(Math.max(0, Math.min(5, Math.round(review.rating))))}</div>
                  </div>
                  <p style={styles.reviewComment}>{review.comment ?? "Không có nội dung đánh giá."}</p>
                </article>
              ))}
            </div>
            <button style={styles.moreReviewBtn}>Xem thêm đánh giá</button>
          </section>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}