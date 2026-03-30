"use client";

import { FormEvent, useMemo, useState } from "react";

type ProductItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  certification: string | null;
  price: number | null;
  isAvailable: boolean;
  createdAt: string;
};

type BrowseResponse = {
  page: number;
  limit: number;
  total: number;
  items: ProductItem[];
};

type ProductDetail = {
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
  };
  supplier: {
    id: string | null;
    certification: string | null;
  };
};

type SortType = "newest" | "price_asc" | "price_desc";

export default function BackendProductsTestPage() {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [certification, setCertification] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortType>("newest");
  const [page, setPage] = useState("1");
  const [limit, setLimit] = useState("20");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrowseResponse | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetail | null>(null);

  const currentPage = useMemo(() => Number(page) || 1, [page]);
  const currentLimit = useMemo(() => Number(limit) || 20, [limit]);

  const buildQueryString = (includeFilters: boolean): string => {
    const params = new URLSearchParams();

    params.set("page", String(currentPage));
    params.set("limit", String(currentLimit));
    params.set("sort", sort);

    if (includeFilters) {
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (categoryId.trim()) params.set("categoryId", categoryId.trim());
      if (certification.trim()) params.set("certification", certification.trim());
      if (minPrice.trim()) params.set("minPrice", minPrice.trim());
      if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    }

    return params.toString();
  };

  const fetchProducts = async (includeFilters: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const query = buildQueryString(includeFilters);
      const response = await fetch(`/api/products?${query}`);
      const data = (await response.json()) as BrowseResponse | { error: string };

      if (!response.ok) {
        const message = "error" in data ? data.error : "Request failed";
        throw new Error(message);
      }

      setResult(data as BrowseResponse);
      setSelectedProductId(null);
      setDetail(null);
      setDetailError(null);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (productId: string) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = (await response.json()) as ProductDetail | { error: string };

      if (!response.ok) {
        const message = "error" in data ? data.error : "Detail request failed";
        throw new Error(message);
      }

      setSelectedProductId(productId);
      setDetail(data as ProductDetail);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unexpected error";
      setDetailError(message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchProducts(true);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h1 className="text-2xl font-bold">Backend Product Test Route</h1>
          <p className="mt-2 text-sm text-slate-600">
            This is a pseudo frontend for testing backend product APIs only. It does not replace storefront UI logic.
          </p>
          <p className="mt-1 text-xs text-slate-500">Route: /backend/products</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <a href="/backend/cart" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Cart Test</a>
            <a href="/backend/orders" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Orders Test</a>
            <a href="/backend/categories" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Categories Test</a>
            <a href="/backend/register" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Register Test</a>
            <a href="/backend/signin" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Sign In Test</a>
            <a href="/backend/profile" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Profile Test</a>
            <a href="/backend/products/auth" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Auth and Account Test</a>
            <a href="/backend/products/qr" className="rounded bg-slate-200 px-2 py-1 text-slate-800">QR Origin Test</a>
            <a href="/backend/products/cart" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Cart and Notes Test</a>
            <a href="/backend/products/reviews" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Review Test</a>
            <a href="/backend/products/subscriptions" className="rounded bg-slate-200 px-2 py-1 text-slate-800">Subscription Test</a>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Browse and Search</h2>

          <form onSubmit={onSearchSubmit} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="keyword"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="categoryId"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              placeholder="certification"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="newest">newest</option>
              <option value="price_asc">price_asc</option>
              <option value="price_desc">price_desc</option>
            </select>

            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="minPrice"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="maxPrice"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="page"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="limit"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="col-span-1 flex flex-wrap gap-2 md:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={() => void fetchProducts(false)}
                disabled={loading}
                className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? "Loading..." : "Browse Active Products"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? "Loading..." : "Search and Filter"}
              </button>
            </div>
          </form>

          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

          {result && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-700">
                total: {result.total} | page: {result.page} | limit: {result.limit}
              </p>
              <div className="overflow-x-auto rounded border border-slate-300">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="px-3 py-2">name</th>
                      <th className="px-3 py-2">category</th>
                      <th className="px-3 py-2">certification</th>
                      <th className="px-3 py-2">price</th>
                      <th className="px-3 py-2">status</th>
                      <th className="px-3 py-2">action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item) => (
                      <tr key={item.productId} className="border-t border-slate-200">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.categoryName ?? "-"}</td>
                        <td className="px-3 py-2">{item.certification ?? "-"}</td>
                        <td className="px-3 py-2">{item.price ?? "-"}</td>
                        <td className="px-3 py-2">{item.isAvailable ? "available" : "unavailable"}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => void fetchDetail(item.productId)}
                            disabled={detailLoading}
                            className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
                          >
                            detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Product Detail</h2>
          {selectedProductId && (
            <p className="mt-1 text-xs text-slate-500">selected product: {selectedProductId}</p>
          )}

          {detailLoading && <p className="mt-3 text-sm text-slate-600">Loading detail...</p>}
          {detailError && <p className="mt-3 text-sm text-rose-700">{detailError}</p>}

          {detail && (
            <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(detail, null, 2)}
            </pre>
          )}

          {!detail && !detailLoading && !detailError && (
            <p className="mt-3 text-sm text-slate-600">Choose a product from the list to inspect backend detail response.</p>
          )}
        </section>
      </div>
    </main>
  );
}
