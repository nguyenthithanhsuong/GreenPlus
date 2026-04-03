"use client";

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

export default function ProductCategoriesTestPage() {
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
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Categories</h1>
        <p className="text-sm text-slate-600">Route tests for /api/categories.</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
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
              className="rounded bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load Categories"}
            </button>
          </div>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}
