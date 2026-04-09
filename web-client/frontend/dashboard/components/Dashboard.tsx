"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import NavigationBar from "./NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type CategoryItem = {
  categoryId: string;
  name: string;
  imageUrl: string | null;
};

type CategoriesResponse = {
  total: number;
  items: CategoryItem[];
};

type ProductItem = {
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
  items: ProductItem[];
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  dashboardContainer: {
    position: "relative",
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    margin: "0 auto",
    boxSizing: "border-box",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
  },
  topSpace: {
    height: "14px",
  },
  locationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: `0 ${SCREEN_HEADER_PADDING_X}`,
    height: "24px",
    color: "#1A4331",
    fontSize: "16px",
    fontWeight: 500,
  },
  locationText: {
    margin: 0,
    lineHeight: "24px",
  },
  mainContent: {
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  searchBox: {
    flex: 1,
    minHeight: "48px",
    borderRadius: "16px",
    border: "1px solid #AAAAAA",
    background: "#F9FAFB",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 10px",
    color: "#AAAAAA",
    fontSize: "16px",
  },
  filterButton: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    border: "1px solid #51B788",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#51B788",
  },
  bannerScroller: {
    width: "100%",
    overflowX: "auto",
    display: "flex",
    gap: "8px",
    scrollSnapType: "x mandatory",
    scrollbarWidth: "none",
  },
  bannerCard: {
    minWidth: "100%",
    height: "152px",
    borderRadius: "16px",
    scrollSnapAlign: "start",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #51B788 0%, #95D5B2 100%)",
  },
  bannerTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: "20px",
    lineHeight: "24px",
    color: "#EAFBF0",
    maxWidth: "170px",
  },
  bannerButton: {
    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#EAFBF0",
    fontWeight: 600,
    fontSize: "16px",
  },
  bannerImageWrap: {
    width: "104px",
    height: "120px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.15)",
    flexShrink: 0,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  sliderDots: {
    display: "flex",
    justifyContent: "center",
    gap: "2px",
    marginTop: "2px",
  },
  dot: {
    width: "4px",
    height: "4px",
    borderRadius: "999px",
    background: "#C7C7C7",
  },
  activeDot: {
    width: "24px",
    height: "4px",
    borderRadius: "8px",
    background: "#51B788",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "24px",
  },
  sectionTitle: {
    margin: 0,
    color: "#1A4331",
    fontWeight: 700,
    fontSize: "18px",
    lineHeight: "24px",
  },
  sectionAction: {
    color: "#8E8E8E",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: "20px",
  },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    columnGap: "10px",
    rowGap: "10px",
  },
  categoryCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "122px",
  },
  categoryImageWrap: {
    width: "100%",
    maxWidth: "84px",
    aspectRatio: "1 / 1",
    borderRadius: "16px",
    background: "#F0F2F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    boxSizing: "border-box",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "10px",
  },
  categoryPlaceholder: {
    width: "56px",
    height: "56px",
    borderRadius: "10px",
    background: "#D4DDD7",
  },
  categoryName: {
    marginTop: "4px",
    width: "100%",
    textAlign: "center",
    color: "#444444",
    fontWeight: 700,
    fontSize: "12px",
    lineHeight: "16px",
    textTransform: "capitalize",
    minHeight: "32px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  infoText: {
    margin: 0,
    color: "#6B7280",
    fontSize: "13px",
    textAlign: "center",
    padding: "8px 0",
  },
  errorText: {
    margin: 0,
    color: "#B91C1C",
    fontSize: "13px",
    textAlign: "center",
    padding: "8px 0",
  },
  productRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  productCard: {
    borderRadius: "16px",
    background: "#F9FAFB",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  productImageWrap: {
    width: "100%",
    height: "108px",
    background: "#EEF4F0",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  productBadge: {
    position: "absolute",
    right: 0,
    top: "8px",
    background: "#2E6A50",
    color: "#E4E4E4",
    fontSize: "8px",
    fontWeight: 600,
    lineHeight: "10px",
    padding: "3px 6px",
    borderRadius: "16px 0 0 16px",
    textTransform: "capitalize",
  },
  productContent: {
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  productName: {
    margin: 0,
    color: "#1A4331",
    fontWeight: 700,
    fontSize: "12px",
    lineHeight: "24px",
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#1A4331",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "20px",
  },
  priceRow: {
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  prices: {
    display: "flex",
    flexDirection: "column",
    color: "#1A4331",
    fontWeight: 700,
    fontSize: "12px",
    lineHeight: "16px",
  },
  oldPrice: {
    color: "#C7C7C7",
    textDecoration: "line-through",
  },
  productLink: {
    color: "inherit",
    textDecoration: "none",
  },
  addButton: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    background: "#51B788",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
  },
};

const Dashboard = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categoryColumns, setCategoryColumns] = useState(4);

  useEffect(() => {
    const resolveColumns = () => {
      const width = window.innerWidth;

      if (width <= 330) {
        setCategoryColumns(2);
        return;
      }

      if (width <= 370) {
        setCategoryColumns(3);
        return;
      }

      setCategoryColumns(4);
    };

    resolveColumns();
    window.addEventListener("resize", resolveColumns);

    return () => {
      window.removeEventListener("resize", resolveColumns);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      setLoadingCategories(true);
      setCategoryError(null);

      try {
        const response = await fetch("/api/categories?sort=name_asc", { signal: controller.signal });
        const data = (await response.json()) as CategoriesResponse | { error?: string };

        if (!response.ok) {
          const message = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(message || "Không thể tải danh mục.");
        }

        setCategories((data as CategoriesResponse).items ?? []);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setCategories([]);
        setCategoryError(requestError instanceof Error ? requestError.message : "Không thể tải danh mục.");
      } finally {
        setLoadingCategories(false);
      }
    };

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError(null);

      try {
        const response = await fetch("/api/products?sort=newest&limit=8", { signal: controller.signal });
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
        setProductsError(requestError instanceof Error ? requestError.message : "Không thể tải sản phẩm.");
      } finally {
        setLoadingProducts(false);
      }
    };

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, []);

  const displayCategories = useMemo(
    () => [
      { categoryId: "all", name: "Tất cả", description: null, imageUrl: null },
      ...categories,
    ],
    [categories],
  );
  const twoRowCategories = useMemo(() => displayCategories.slice(0, categoryColumns * 2), [displayCategories, categoryColumns]);
  const freshProducts = useMemo(() => products.slice(0, 2), [products]);
  const dealProducts = useMemo(() => products.slice(2, 4), [products]);

  const formatPrice = (value: number | null): string => {
    if (value === null) {
      return "Liên hệ";
    }

    return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.dashboardContainer}>
        <div style={styles.topSpace} />
        <div style={styles.locationRow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="#1A4331" strokeWidth="1.8" />
            <circle cx="12" cy="10" r="2.5" fill="#1A4331" />
          </svg>
          <p style={styles.locationText}>Thủ Đức, Hồ Chí Minh</p>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 9 6 6 6-6" stroke="#1A4331" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <main style={styles.mainContent}>
          <section style={styles.searchRow}>
            <div style={styles.searchBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="#AAAAAA" strokeWidth="2" />
                <path d="m20 20-4-4" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Tìm kiếm trên FRESH DROP</span>
            </div>
            <button type="button" style={styles.filterButton} aria-label="Lọc">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" stroke="#51B788" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </section>

          <section>
            <div style={styles.bannerScroller}>
              <article style={styles.bannerCard}>
                <div>
                  <h2 style={styles.bannerTitle}>Rau quả tươi giảm giá sốc</h2>
                  <span style={styles.bannerButton}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6" stroke="#EAFBF0" strokeWidth="1.8" />
                      <circle cx="10" cy="20" r="1.2" fill="#EAFBF0" />
                      <circle cx="17" cy="20" r="1.2" fill="#EAFBF0" />
                    </svg>
                    Mua ngay
                  </span>
                </div>
                <div style={styles.bannerImageWrap}>
                  <img
                    src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80"
                    alt="Khuyến mãi rau củ"
                    style={styles.bannerImage}
                  />
                </div>
              </article>
            </div>
            <div style={styles.sliderDots}>
              <span style={styles.dot} />
              <span style={styles.activeDot} />
              <span style={styles.dot} />
            </div>
          </section>

          <section>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Danh mục</h3>
              <span style={styles.sectionAction}>Xem thêm</span>
            </div>

            {loadingCategories && <p style={styles.infoText}>Đang tải danh mục...</p>}
            {!loadingCategories && categoryError && <p style={styles.errorText}>{categoryError}</p>}
            {!loadingCategories && !categoryError && twoRowCategories.length === 0 && (
              <p style={styles.infoText}>Không có danh mục để hiển thị.</p>
            )}

            {!loadingCategories && !categoryError && twoRowCategories.length > 0 && (
              <div
                style={{
                  ...styles.categoryGrid,
                  gridTemplateColumns: `repeat(${categoryColumns}, minmax(0, 1fr))`,
                  columnGap: categoryColumns === 4 ? "10px" : "12px",
                }}
              >
                {twoRowCategories.map((category) => {
                  const hasImage = Boolean(category.imageUrl) && category.categoryId !== "all" && !brokenImageIds[category.categoryId];
                  const categoryHref = `/category-products/${category.categoryId}?name=${encodeURIComponent(category.name)}&backTo=${encodeURIComponent("/dashboard")}`;

                  return (
                    <Link key={category.categoryId} href={categoryHref} style={styles.productLink}>
                      <article style={styles.categoryCard}>
                        <div style={styles.categoryImageWrap}>
                          {hasImage ? (
                            <img
                              src={category.imageUrl ?? ""}
                              alt={category.name}
                              style={styles.categoryImage}
                              onError={() =>
                                setBrokenImageIds((previous) => ({
                                  ...previous,
                                  [category.categoryId]: true,
                                }))
                              }
                            />
                          ) : (
                            <div style={styles.categoryPlaceholder} />
                          )}
                        </div>
                        <div style={styles.categoryName}>{category.name}</div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Nông sản tươi ngon</h3>
              <span style={styles.sectionAction}>Xem thêm</span>
            </div>
            {loadingProducts && <p style={styles.infoText}>Đang tải sản phẩm...</p>}
            {!loadingProducts && productsError && <p style={styles.errorText}>{productsError}</p>}
            <div style={styles.productRow}>
              {freshProducts.map((product) => (
                <Link key={product.productId} href={`/product-detail/${product.productId}?backTo=${encodeURIComponent("/dashboard")}`} style={styles.productLink}>
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
                      <div style={styles.ratingRow}>
                        <span aria-hidden="true">★</span>
                        <span>{product.isAvailable ? "Sẵn hàng" : "Tạm hết"}</span>
                      </div>
                      <div style={styles.priceRow}>
                        <div style={styles.prices}>
                          <span>{formatPrice(product.price)}</span>
                        </div>
                        <button type="button" style={styles.addButton} aria-label={`Thêm ${product.name}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Ưu đãi hôm nay</h3>
              <span style={styles.sectionAction}>Xem thêm</span>
            </div>
            {!loadingProducts && !productsError && dealProducts.length === 0 && <p style={styles.infoText}>Không có sản phẩm ưu đãi.</p>}
            <div style={styles.productRow}>
              {dealProducts.map((product) => (
                <Link key={product.productId} href={`/product-detail/${product.productId}?backTo=${encodeURIComponent("/dashboard")}`} style={styles.productLink}>
                  <article style={styles.productCard}>
                    <div style={styles.productImageWrap}>
                      <div style={styles.productBadge}>Mua ngay</div>
                      <img
                        src={product.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"}
                        alt={product.name}
                        style={styles.productImage}
                      />
                    </div>
                    <div style={styles.productContent}>
                      <p style={styles.productName}>{product.name}</p>
                      <div style={styles.ratingRow}>
                        <span aria-hidden="true">★</span>
                        <span>{product.categoryName ?? "Sản phẩm"}</span>
                      </div>
                      <div style={styles.priceRow}>
                        <div style={styles.prices}>
                          <span>{formatPrice(product.price)}</span>
                          <span style={styles.oldPrice}>Đang cập nhật</span>
                        </div>
                        <button type="button" style={styles.addButton} aria-label={`Thêm ${product.name}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
};

export default Dashboard;
