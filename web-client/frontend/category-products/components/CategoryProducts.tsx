"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../dashboard/components/NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type ProductItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  certification: string | null;
  price: number | null;
  isAvailable: boolean;
  createdAt: string;
};

type ProductsResponse = {
  page: number;
  limit: number;
  total: number;
  items: ProductItem[];
};

type CategoryProductsProps = {
  categoryId: string;
  categoryName?: string;
  backHref?: string;
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
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
  },
  topNav: {
    height: "48px",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: {
    margin: 0,
    color: "#1A4331",
    fontWeight: 700,
    fontSize: "20px",
    lineHeight: "24px",
  },
  iconButton: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1E1E1E",
  },
  mainContent: {
    flex: 1,
    padding: `12px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  description: {
    margin: 0,
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: "20px",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  productLink: {
    color: "inherit",
    textDecoration: "none",
  },
  productCard: {
    borderRadius: "16px",
    background: "#F9FAFB",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: "230px",
  },
  productImageWrap: {
    width: "100%",
    height: "112px",
    background: "#EEF4F0",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  productContent: {
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  productName: {
    margin: 0,
    color: "#1A4331",
    fontWeight: 700,
    fontSize: "13px",
    lineHeight: "18px",
    minHeight: "36px",
  },
  productMeta: {
    margin: 0,
    color: "#1A4331",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: "16px",
  },
  statusText: {
    margin: 0,
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: "16px",
  },
  priceRow: {
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  addButton: {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    border: "none",
    background: "#51B788",
    color: "#FFFFFF",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
};

function formatPrice(value: number | null): string {
  if (value === null) {
    return "Liên hệ";
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export default function CategoryProducts({ categoryId, categoryName, backHref }: CategoryProductsProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        query.set("sort", "newest");
        query.set("limit", "40");
        if (categoryId !== "all") {
          query.set("categoryId", categoryId);
        }

        const response = await fetch(`/api/products?${query.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as ProductsResponse | { error?: string };

        if (!response.ok) {
          const message = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(message || "Không thể tải sản phẩm.");
        }

        setProducts((data as ProductsResponse).items ?? []);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setProducts([]);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [categoryId]);

  const resolvedCategoryName = useMemo(() => {
    if (categoryName && categoryName.trim().length > 0) {
      return categoryName;
    }

    if (categoryId === "all") {
      return "Tất cả";
    }

    return products[0]?.categoryName ?? "Sản phẩm theo danh mục";
  }, [categoryName, products]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href={backHref ?? "/dashboard"} style={styles.iconButton} aria-label="Quay lại Dashboard">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.topTitle}>{resolvedCategoryName}</h1>
          <div style={{ width: "24px", height: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          <p style={styles.description}>Danh sách sản phẩm thuộc danh mục đã chọn.</p>

          {loading && <p style={styles.infoText}>Đang tải sản phẩm...</p>}
          {!loading && error && <p style={styles.errorText}>{error}</p>}
          {!loading && !error && products.length === 0 && <p style={styles.infoText}>{categoryId === "all" ? "Chưa có sản phẩm nào." : "Danh mục này chưa có sản phẩm."}</p>}

          {!loading && !error && products.length > 0 && (
            <div style={styles.productGrid}>
              {products.map((product) => (
                <Link key={product.productId} href={`/product-detail/${product.productId}?backTo=${encodeURIComponent(backHref ?? "/dashboard")}`} style={styles.productLink}>
                  <article style={styles.productCard}>
                    <div style={styles.productImageWrap}>
                      <img
                        src={product.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"}
                        alt={product.name}
                        style={styles.productImage}
                      />
                    </div>
                    <div style={styles.productContent}>
                      <p style={styles.productName}>{product.name}</p>
                      <p style={styles.productMeta}>{product.categoryName ?? "Sản phẩm"}</p>
                      <p style={styles.statusText}>{product.isAvailable ? "Sẵn hàng" : "Tạm hết hàng"}</p>
                      <div style={styles.priceRow}>
                        <p style={{ ...styles.productMeta, margin: 0, fontWeight: 700 }}>{formatPrice(product.price)}</p>
                        <button type="button" style={styles.addButton} aria-label={`Thêm ${product.name}`}>
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
