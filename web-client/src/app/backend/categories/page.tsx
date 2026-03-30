"use client";

import Link from "next/link";
import { useState } from "react";

type CategoryItem = {
  categoryId: string;
  name: string;
  description: string | null;
};

type CategoryResult = {
  total: number;
  items: CategoryItem[];
};

type SortType = "name_asc" | "name_desc" | "newest";

export default function BackendCategoriesTestPage() {
  const [sort, setSort] = useState<SortType>("name_asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CategoryResult | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories?sort=${encodeURIComponent(sort)}`);
      const data = (await response.json()) as CategoryResult | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Load categories failed");
      }

      setResult(data as CategoryResult);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h1 className="text-2xl font-bold">Backend Test: Categories</h1>
          <p className="mt-2 text-sm text-slate-600">Use this page to load categories from /api/categories.</p>
          <p className="mt-1 text-xs text-slate-500">Route: /backend/categories</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/backend/products" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Product Backend Test
            </Link>
            <Link href="/backend/register" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Register Test
            </Link>
            <Link href="/backend/profile" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Profile Test
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Load Categories</h2>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortType)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="name_asc">name_asc</option>
              <option value="name_desc">name_desc</option>
              <option value="newest">newest</option>
            </select>

            <button
              onClick={() => void loadCategories()}
              disabled={loading}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load Categories"}
            </button>
          </div>

          {result && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-700">total: {result.total}</p>
              <div className="overflow-x-auto rounded border border-slate-300">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="px-3 py-2">category_id</th>
                      <th className="px-3 py-2">name</th>
                      <th className="px-3 py-2">description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item) => (
                      <tr key={item.categoryId} className="border-t border-slate-200">
                        <td className="px-3 py-2">{item.categoryId}</td>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.description ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
      </div>
    </main>
  );
}
