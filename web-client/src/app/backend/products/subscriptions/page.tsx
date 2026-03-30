"use client";

import { useEffect, useState } from "react";

type SubscriptionResult = {
  subscriptionId: string;
  userId: string;
  productId: string;
  schedule: string;
  status: string;
  startDate: string;
  nextDeliveryPreview: string;
};

type ProductOption = {
  product_id: string;
  name: string;
};

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

export default function ProductSubscriptionTestPage() {
  const [productId, setProductId] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [activeUserId, setActiveUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubscriptionResult | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    setActiveUserId(saved);

    const loadOptions = async () => {
      try {
        const response = await fetch("/api/testing/options");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { products?: ProductOption[] };
        const products = payload.products ?? [];
        setProductOptions(products);

        if (products.length > 0) {
          setProductId((current) => current || products[0].product_id);
        }
      } catch {
        // Khong chan test page neu options load that bai.
      }
    };

    void loadOptions();
  }, []);

  const requireLoggedInUserId = (): string => {
    if (!activeUserId) {
      throw new Error("Please login test user from top-right corner first");
    }

    return activeUserId;
  };

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: requireLoggedInUserId(), productId, frequency }),
      });

      const data = (await response.json()) as SubscriptionResult | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Subscription failed");
      }

      setResult(data as SubscriptionResult);
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Subscribe Recurring Order</h1>
        <p className="text-sm text-slate-600">Route test for use case 36 via /api/subscriptions.</p>
        <p className="text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="grid grid-cols-1 gap-2">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select product_id</option>
              {productOptions.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name} ({product.product_id})
                </option>
              ))}
            </select>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>
          </div>
          <button onClick={() => void submit()} disabled={loading} className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
            {loading ? "Submitting..." : "Create Subscription"}
          </button>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}
