"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavigationBar from "../../dashboard/components/NavigationBar";
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
    fontFamily: "'Inter', sans-serif",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
  topNav: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "20px",
    color: "#081B15",
    textTransform: "capitalize",
    margin: 0,
  },
  iconPlaceholder: {
    width: "24px",
    height: "24px",
    cursor: "pointer",
  },
  mainContent: {
    flex: 1,
    padding: `20px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "clamp(12px, 2.8vw, 18px)",
    alignItems: "center",
  },
  sectionFrame: {
    width: "100%",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "clamp(12px, 2.8vw, 16px)",
  },
  searchSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "clamp(8px, 2.2vw, 16px)",
    minHeight: "44px",
    width: "100%",
  },
  searchInputContainer: {
    flex: 1,
    background: "#F9FAFB",
    border: "1px solid #AAAAAA",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    padding: "0 clamp(10px, 2.4vw, 12px)",
    gap: "clamp(6px, 2vw, 8px)",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    width: "100%",
    fontSize: "clamp(14px, 3.6vw, 16px)",
    color: "#333",
  },
  filterButton: {
    width: "clamp(42px, 11vw, 48px)",
    height: "clamp(42px, 11vw, 48px)",
    border: "1px solid #51B788",
    borderRadius: "14px",
    background: "#FFFFFF",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  categorySection: {
    display: "flex",
    flexDirection: "column",
    gap: "clamp(12px, 2.8vw, 16px)",
    width: "100%",
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: "18px",
    color: "#081B15",
    textTransform: "capitalize",
    margin: 0,
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
    columnGap: "clamp(8px, 2.4vw, 16px)",
    rowGap: "clamp(10px, 2.6vw, 14px)",
  },
  categoryCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    minHeight: "116px",
    gap: "0px",
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
  },
  imageContainer: {
    width: "min(98px, 100%)",
    aspectRatio: "1 / 1",
    background: "#F0F2F5",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "14px",
  },
  placeholderImage: {
    width: "70px",
    height: "70px",
    background: "#DCE6DE",
    borderRadius: "8px",
  },
  categoryImage: {
    width: "70px",
    height: "70px",
    borderRadius: "8px",
    objectFit: "cover",
  },
  categoryName: {
    fontWeight: 700,
    fontSize: "clamp(11px, 2.8vw, 12px)",
    lineHeight: "1.3",
    color: "#444444",
    textAlign: "center",
    textTransform: "capitalize",
    width: "100%",
    minHeight: "26px",
    marginTop: "6px",
  },
  infoText: {
    fontSize: "13px",
    color: "#6B7280",
    textAlign: "center",
    margin: 0,
    padding: "10px 0",
  },
  errorText: {
    fontSize: "13px",
    color: "#B91C1C",
    textAlign: "center",
    margin: 0,
    padding: "10px 0",
  },
};

const Category = () => {
  const [searchValue, setSearchValue] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      setLoading(true);
      setError(null);

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
        setError(requestError instanceof Error ? requestError.message : "Không thể tải danh mục.");
      } finally {
        setLoading(false);
      }
    };

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const allCategory: CategoryItem = {
      categoryId: "all",
      name: "Tất cả",
      imageUrl: null,
    };

    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return [allCategory, ...categories];
    }

    return [allCategory, ...categories.filter((category) => category.name.toLowerCase().includes(keyword))];
  }, [categories, searchValue]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
        <div style={styles.iconPlaceholder}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#081B15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.headerTitle}>Danh Mục</h1>
        <div style={{ width: "24px" }}></div>
        </header>

        <main style={styles.mainContent}>
        <div style={styles.sectionFrame}>
          <div style={styles.searchSection}>
            <div style={styles.searchInputContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="#AAAAAA"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M21 21L16.65 16.65" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tìm kiếm danh mục"
                style={styles.searchInput}
              />
            </div>
            <button style={styles.filterButton}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="#51B788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div style={styles.categorySection}>
            <h2 style={styles.sectionTitle}>Tất cả danh mục</h2>

            {loading && <p style={styles.infoText}>Đang tải danh mục...</p>}
            {!loading && error && <p style={styles.errorText}>{error}</p>}
            {!loading && !error && filteredCategories.length === 0 && <p style={styles.infoText}>Không có danh mục phù hợp.</p>}

            {!loading && !error && filteredCategories.length > 0 && (
              <div style={styles.gridContainer}>
                {filteredCategories.map((category) => {
                  const hasImage = Boolean(category.imageUrl) && category.categoryId !== "all" && !brokenImageIds[category.categoryId];
                  const categoryHref = `/category-products/${category.categoryId}?name=${encodeURIComponent(category.name)}&backTo=${encodeURIComponent("/category")}`;

                  return (
                    <Link key={category.categoryId} href={categoryHref} style={styles.cardLink}>
                      <div style={styles.categoryCard}>
                        <div style={styles.imageContainer}>
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
                            <div style={styles.placeholderImage}></div>
                          )}
                        </div>
                        <span style={styles.categoryName}>{category.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
};

export default Category;
