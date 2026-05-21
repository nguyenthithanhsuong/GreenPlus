"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { compose, withErrorBoundary } from "@/lib/decorators";
import { useAuthStore } from "@/lib/stores/authStore";
import ProductService, {
  ProductDetailData,
  ReviewItem,
} from "@/lib/services/ProductService";
import ProductAdapter, {
  ProductBrowseUIModel,
} from "@/lib/adapter/ProductAdapter";
import CartService from "@/lib/services/CartService";
import PaymentService from "@/lib/services/PaymentService";
import SubscriptionModal from "./SubscriptionModal";
import GroupPurchaseModal from "./GroupPurchaseModal";
import PurchaseModeSelector from "./PurchaseModeSelector";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type DetailSection = "detail" | "nutrition" | "origin";

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
    background:
      "linear-gradient(140deg, #d1fae5 0%, #a7f3d0 55%, #6ee7b7 100%)",
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
  warningBox: {
    borderRadius: "12px",
    border: "1px solid #FCA5A5",
    background: "#FEF2F2",
    padding: "10px 12px",
  },
  warningText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#B91C1C",
    fontWeight: 600,
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
    background:
      "linear-gradient(140deg, #ecfdf5 0%, #d1fae5 70%, #a7f3d0 100%)",
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

function formatBatchStatus(
  status: "available" | "expired" | "sold_out",
): string {
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

function toMidnightTimestamp(value: string): number {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function todayMidnightTimestamp(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function BaseProductDetail({
  productId,
  backHref,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const routerUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductBrowseUIModel[]>(
    [],
  );
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState<string | null>(null);
  const [cartActionLoading, setCartActionLoading] = useState(false);
  const [cartActionMessage, setCartActionMessage] = useState<string | null>(
    null,
  );
  const [purchaseMode, setPurchaseMode] = useState<
    "cart" | "subscription" | "group"
  >("cart");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showGroupPurchaseModal, setShowGroupPurchaseModal] = useState(false);

  const [expanded, setExpanded] = useState<Record<DetailSection, boolean>>({
    detail: false,
    nutrition: false,
    origin: false,
  });

  useEffect(() => {
    // Add animation styles globally
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const detailData = await ProductService.getProductDetail(productId);
        setProduct(detailData);

        if (detailData.category.id) {
          const relatedData = await ProductService.getProducts({
            categoryId: detailData.category.id,
            sort: "newest",
            limit: 6,
          });
          setRelatedProducts(
            relatedData.items.filter(
              (item) => item.productId !== detailData.productId,
            ).map((item) => ProductAdapter.toBrowseUIModel(item)),
          );
        } else {
          setRelatedProducts([]);
        }

        const reviewsData = await ProductService.getReviews(
          detailData.productId,
          10,
        );
        setReviews(reviewsData.items ?? []);
      } catch (requestError) {
        console.error("[ProductDetail] load failed", {
          productId,
          error: requestError,
        });
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải chi tiết sản phẩm.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [productId]);

  const productUIModel = useMemo(
    () => (product ? ProductAdapter.toDetailUIModel(product, reviews) : null),
    [product, reviews],
  );
  const reviewUIModels = useMemo(
    () => reviews.map((review) => ProductAdapter.toReviewUIModel(review)),
    [reviews],
  );
  const heroImage = productUIModel?.images[0] ?? null;
  const resolvedName = productUIModel?.name ?? null;
  const resolvedDescription = productUIModel?.description ?? null;
  const resolvedNutrition = productUIModel?.nutrition ?? null;
  const resolvedPrice = productUIModel ? formatPrice(productUIModel.price) : null;
  const effectiveAvailability = useMemo(() => {
    if (!product) {
      return {
        isExpired: false,
        canPurchase: false,
        warning: null as string | null,
      };
    }

    const today = todayMidnightTimestamp();
    const hasSellableUnexpiredBatch = product.batches.some(
      (batch) =>
        batch.status === "available" &&
        batch.available > 0 &&
        toMidnightTimestamp(batch.expireDate) >= today,
    );

    const allBatchesExpired =
      product.batches.length > 0 &&
      product.batches.every(
        (batch) =>
          batch.status === "expired" ||
          toMidnightTimestamp(batch.expireDate) < today,
      );

    const isExpired =
      product.inventory.status === "expired" || allBatchesExpired;
    const canPurchase = !isExpired && hasSellableUnexpiredBatch;

    let warning: string | null = null;
    if (isExpired) {
      warning = "Sản phẩm này đã hết hạn, hiện không thể mua.";
    } else if (!canPurchase) {
      warning = "Sản phẩm hiện không còn lô hàng khả dụng để mua.";
    }

    return { isExpired, canPurchase, warning };
  }, [product]);

  const resolvedCategoryName = productUIModel?.categoryName ?? null;
  const ratingText = productUIModel ? productUIModel.ratings.average.toFixed(1) : "0.0";

  const handleSubscription = async (frequency: string) => {
    if (!productId || !isAuthenticated || !routerUser?.user_id) {
      setCartActionMessage("Vui lòng đăng nhập để đặt lịch mua định kì.");
      return;
    }

    setCartActionLoading(true);
    try {
      await PaymentService.createSubscription({
        userId: routerUser.user_id,
        productId,
        frequency,
      });

      setCartActionMessage("✓ Đã đặt lịch mua định kì thành công!");
      setTimeout(() => {
        setCartActionMessage(null);
        setPurchaseMode("cart");
      }, 3000);
    } catch (requestError) {
      setCartActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Không thể đặt lịch mua định kì.",
      );
    } finally {
      setCartActionLoading(false);
    }
  };

  const handleGroupPurchase = async (groupId: string, joinQuantity: number) => {
    if (!isAuthenticated || !routerUser?.user_id) {
      setCartActionMessage("Vui lòng đăng nhập để tham gia mua chung.");
      return;
    }

    setCartActionLoading(true);
    try {
      await PaymentService.joinGroupPurchase({
        userId: routerUser.user_id,
        groupId,
        quantity: joinQuantity,
      });

      setCartActionMessage("✓ Đã tham gia mua chung thành công!");
      setTimeout(() => {
        setCartActionMessage(null);
        setPurchaseMode("cart");
      }, 3000);
    } catch (requestError) {
      setCartActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tham gia mua chung.",
      );
    } finally {
      setCartActionLoading(false);
    }
  };

  const handlePurchaseAction = async () => {
    const qty = Math.max(1, Number(quantity) || 1);
    const mode = purchaseMode;

    if (!effectiveAvailability.canPurchase) {
      setCartActionMessage(
        effectiveAvailability.warning ?? "Sản phẩm hiện không thể mua.",
      );
      return;
    }

    if (mode === "subscription") {
      setShowSubscriptionModal(true);
      return;
    }

    if (mode === "group") {
      setShowGroupPurchaseModal(true);
      return;
    }

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
      await CartService.addToCart({
        userId: routerUser.user_id,
        productId,
        quantity: qty,
      });
      setCartActionMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (requestError) {
      setCartActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Không thể thêm sản phẩm vào giỏ hàng.",
      );
    } finally {
      setCartActionLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setShowGroupPurchaseModal(false);
    setCartActionMessage("Đang chuyển sang trang tạo nhóm mua chung...");
    setTimeout(() => {
      window.location.href = "/group-purchase/create";
    }, 500);
  };
  // If no productId is provided, show an error state
  if (!productId) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.topNav}>
            <Link
              href="/dashboard"
              style={styles.iconButton}
              aria-label="Quay lại"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <h1 style={styles.topTitle}>Chi tiết sản phẩm</h1>
            <div style={{ width: "24px" }} />
          </header>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1E1E1E",
                  marginBottom: "16px",
                }}
              >
                Không tìm thấy sản phẩm
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#717171",
                  marginBottom: "24px",
                }}
              >
                Vui lòng quay lại và chọn một sản phẩm khác
              </p>
              <Link
                href="/dashboard"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  background: "#51B788",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
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
          <Link
            href={
              backHref ??
              (product?.category.id
                ? `/category-products/${product.category.id}?name=${encodeURIComponent(product.category.name ?? "Danh mục")}`
                : "/dashboard")
            }
            style={styles.iconButton}
            aria-label="Quay lại"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#1E1E1E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 style={styles.topTitle}>Chi Tiết Sản Phẩm</h1>
          <div style={{ width: "24px", height: "24px" }} />
        </header>

        {heroImage ? (
          <img
            src={heroImage}
            alt={resolvedName ?? "Ảnh sản phẩm"}
            style={styles.heroImage}
          />
        ) : (
          <div style={styles.heroImage} />
        )}

        <div style={styles.slider}>
          <div style={styles.sliderActive} />
          <div style={styles.sliderDot} />
          <div style={styles.sliderDot} />
        </div>

        <main style={styles.mainContent}>
          {loading && (
            <p style={{ ...styles.detailText, margin: 0 }}>
              Đang tải chi tiết sản phẩm...
            </p>
          )}
          {!loading && error && (
            <p style={{ ...styles.detailText, margin: 0, color: "#B91C1C" }}>
              {error}
            </p>
          )}

          <section style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <h2 style={styles.detailName}>
                {resolvedName ??
                  (loading ? "Đang tải..." : "Sản phẩm chưa cập nhật")}
              </h2>
              <p style={styles.rating}>
                {loading ? "Đang tải" : `★ ${ratingText}`}
              </p>
            </div>

            <PurchaseModeSelector
              currentMode={purchaseMode}
              onModeChange={setPurchaseMode}
            />

            <div style={styles.quantityRow}>
              <span style={styles.detailText}>Số lượng</span>
              <div style={styles.quantityControl}>
                <button
                  type="button"
                  style={styles.quantityButton}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1 || cartActionLoading}
                  aria-label="Giảm số lượng"
                >
                  -
                </button>
                <span style={styles.quantityValue}>{quantity}</span>
                <button
                  type="button"
                  style={styles.quantityButton}
                  onClick={() => setQuantity((current) => current + 1)}
                  disabled={cartActionLoading}
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>
            </div>
            
            <p style={styles.detailText}>
              {resolvedDescription ??
                (loading
                  ? "Đang tải mô tả sản phẩm..."
                  : "Mô tả sản phẩm đang được cập nhật.")}
            </p>

            <p style={styles.priceText}>
                {resolvedPrice ?? (loading ? "Đang tải..." : "Liên hệ")}
            </p>

            {effectiveAvailability.warning ? (
              <div style={styles.warningBox}>
                <p style={styles.warningText}>
                  {effectiveAvailability.warning}
                </p>
              </div>
            ) : null}

            <div style={styles.ctaRow}>
              <button
                type="button"
                style={styles.addButton}
                onClick={() => void handlePurchaseAction()}
                disabled={cartActionLoading || !effectiveAvailability.canPurchase}
              >
                {cartActionLoading ? "Đang xử lý..." : "Tiếp tục"}
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
            {cartActionMessage && (
              <p style={{ ...styles.detailText, margin: 0, fontSize: "13px" }}>
                {cartActionMessage}
              </p>
            )}
          </section>

          <section style={styles.accordionList}>
            <button
              style={styles.accordionHeader}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, detail: !prev.detail }))
              }
            >
              <span>Chi tiết sản phẩm</span>
              <span>{expanded.detail ? "▲" : "▼"}</span>
            </button>
            {expanded.detail && (
              <p style={styles.accordionBody}>
                {resolvedDescription ??
                  "Thông tin chi tiết sản phẩm đang được cập nhật từ backend."}
              </p>
            )}

            <button
              style={styles.accordionHeader}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, nutrition: !prev.nutrition }))
              }
            >
              <span>Dinh dưỡng</span>
              <span>{expanded.nutrition ? "▲" : "▼"}</span>
            </button>
            {expanded.nutrition && (
              <p style={styles.accordionBody}>
                {resolvedNutrition ??
                  "Thông tin dinh dưỡng chưa có trong backend."}
              </p>
            )}

            <button
              style={styles.accordionHeader}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, origin: !prev.origin }))
              }
            >
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
                      <p
                        style={styles.batchItemTitle}
                      >{`Batch ${batch.batchId.slice(0, 8)}...`}</p>
                      <p
                        style={styles.batchItemMeta}
                      >{`Trạng thái: ${formatBatchStatus(batch.status)} | Có thể bán: ${batch.isSellable ? "Có" : "Không"}`}</p>
                      <p
                        style={styles.batchItemMeta}
                      >{`Số lượng: ${batch.quantity} | Khả dụng: ${batch.available} | Giữ chỗ: ${batch.reserved}`}</p>
                      <p
                        style={styles.batchItemMeta}
                      >{`Hạn dùng: ${new Date(batch.expireDate).toLocaleDateString("vi-VN")}`}</p>
                    </article>
                  ))}

                  {(product?.batches?.length ?? 0) === 0 && (
                    <p style={styles.batchItemMeta}>
                      Chưa có lô hàng nào cho sản phẩm này.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section>
            <h3 style={styles.sectionTitle}>Sản phẩm tương tự</h3>
            {!loading && relatedProducts.length === 0 && (
              <p style={styles.reviewComment}>Chưa có sản phẩm tương tự.</p>
            )}
            <div style={styles.similarList}>
              {relatedProducts.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/product-detail/${item.id}`}
                  style={styles.similarLink}
                >
                  <article style={styles.similarCard}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={styles.similarImage}
                      />
                    ) : (
                      <div style={styles.similarImage} />
                    )}
                    <div>
                      <p style={styles.similarName}>{item.name}</p>
                      <p style={styles.similarMeta}>
                        {item.categoryName ?? "Sản phẩm"}
                      </p>
                    </div>
                    <div style={styles.similarFooter}>
                      <p style={{ ...styles.similarMeta, fontWeight: 700 }}>
                        {formatPrice(item.price)}
                      </p>
                      <button style={styles.smallAddBtn}>+</button>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h3 style={styles.sectionTitle}>Đánh giá</h3>
            {reviews.length === 0 && !loading && (
              <p style={styles.reviewComment}>
                Chưa có đánh giá cho sản phẩm này.
              </p>
            )}
            <div style={styles.reviewList}>
              {reviewUIModels.map((review) => (
                <article key={review.id} style={styles.reviewCard}>
                  <div style={styles.reviewTop}>
                    <div style={styles.reviewerBlock}>
                      {review.avatar ? (
                        <img
                          src={review.avatar}
                          alt={review.author}
                          style={styles.avatar}
                        />
                      ) : (
                        <div style={styles.reviewAvatarFallback}>
                          {review.author.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p style={styles.reviewerName}>{review.author}</p>
                        <p style={styles.reviewDate}>
                          {review.createdAt.toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <div style={styles.rating}>
                      {buildStars(review.rating)}
                    </div>
                  </div>
                  <p style={styles.reviewComment}>
                    {review.comment ?? "Không có nội dung đánh giá."}
                  </p>
                </article>
              ))}
            </div>
            <button style={styles.moreReviewBtn}>Xem thêm đánh giá</button>
          </section>
        </main>

        <SubscriptionModal
          isOpen={showSubscriptionModal}
          productId={productId ?? ""}
          productName={product?.name ?? "Sản phẩm"}
          price={product?.availablePrice ?? null}
          onClose={() => setShowSubscriptionModal(false)}
          onSubmit={handleSubscription}
        />

        <GroupPurchaseModal
          isOpen={showGroupPurchaseModal}
          productId={productId ?? ""}
          productName={product?.name ?? "Sản phẩm"}
          regularPrice={product?.availablePrice ?? null}
          onClose={() => setShowGroupPurchaseModal(false)}
          onSubmit={handleGroupPurchase}
          onCreateGroup={handleCreateGroup}
        />

        <NavigationBar />
      </div>
    </div>
  );
}
export default compose(
  withErrorBoundary
)(BaseProductDetail);
