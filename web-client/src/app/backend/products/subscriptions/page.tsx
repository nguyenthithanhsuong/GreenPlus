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

type SubscriptionListResponse = {
  subscriptions: SubscriptionResult[];
};

type UnsubscribeResult = {
  subscriptionId: string;
  userId: string;
  productId: string;
  status: string;
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
  const [listLoading, setListLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubscriptionResult | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([]);
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

  useEffect(() => {
    if (!activeUserId) {
      setSubscriptions([]);
      return;
    }

    void loadSubscriptions(activeUserId);
  }, [activeUserId]);

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
      await loadSubscriptions(requireLoggedInUserId());
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async (userId?: string) => {
    const resolvedUserId = userId ?? requireLoggedInUserId();
    setListLoading(true);

    try {
      const response = await fetch(`/api/subscriptions?userId=${encodeURIComponent(resolvedUserId)}`);
      const data = (await response.json()) as SubscriptionListResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Failed to load subscriptions");
      }

      setSubscriptions((data as SubscriptionListResponse).subscriptions ?? []);
    } catch (listError) {
      setSubscriptions([]);
      setError(listError instanceof Error ? listError.message : "Unexpected error");
    } finally {
      setListLoading(false);
    }
  };

  const unsubscribe = async (subscriptionId: string) => {
    setError(null);
    setCancelingId(subscriptionId);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: requireLoggedInUserId(), subscriptionId }),
      });

      const data = (await response.json()) as UnsubscribeResult | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Unsubscribe failed");
      }

      await loadSubscriptions(requireLoggedInUserId());
    } catch (unsubscribeError) {
      setError(unsubscribeError instanceof Error ? unsubscribeError.message : "Unexpected error");
    } finally {
      setCancelingId("");
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

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Current Subscriptions</h2>
            <button
              onClick={() => void loadSubscriptions()}
              disabled={listLoading || !activeUserId}
              className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:opacity-60"
            >
              {listLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No subscriptions found for this user.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {subscriptions.map((item) => (
                <div key={item.subscriptionId} className="rounded border border-slate-200 p-3">
                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-2">
                    <p>subscriptionId: {item.subscriptionId}</p>
                    <p>productId: {item.productId}</p>
                    <p>schedule: {item.schedule}</p>
                    <p>status: {item.status}</p>
                    <p>startDate: {item.startDate}</p>
                    <p>nextDeliveryPreview: {item.nextDeliveryPreview}</p>
                  </div>
                  <button
                    onClick={() => void unsubscribe(item.subscriptionId)}
                    disabled={cancelingId === item.subscriptionId || item.status === "cancelled"}
                    className="mt-3 rounded bg-rose-600 px-3 py-1 text-xs text-white disabled:opacity-60"
                  >
                    {cancelingId === item.subscriptionId ? "Unsubscribing..." : "Unsubscribe"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}
