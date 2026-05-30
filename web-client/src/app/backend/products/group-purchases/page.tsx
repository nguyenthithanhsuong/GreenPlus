"use client";

import { useEffect, useState } from "react";

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

type ProductOption = {
  product_id: string;
  name: string;
};

type DeadlinePreset = "1d" | "2d" | "3d" | "1w" | "custom";

export default function GroupPurchaseTestPage() {
  const [activeUserId, setActiveUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("10");
  const [minQuantity, setMinQuantity] = useState("5");
  const [discountPrice, setDiscountPrice] = useState("");
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePreset>("1d");
  const [customDeadlineLocal, setCustomDeadlineLocal] = useState("");
  const [groupId, setGroupId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        // Keep page usable even if option loading fails.
      }
    };

    void loadOptions();
  }, []);

  const requireUserId = (): string => {
    if (!activeUserId) {
      throw new Error("Please login test user from top-right corner first");
    }

    return activeUserId;
  };

  const resolveDeadlineIso = (): string => {
    if (deadlinePreset === "custom") {
      const local = customDeadlineLocal.trim();
      if (!local) {
        throw new Error("Please choose a custom deadline date/time");
      }

      const customDate = new Date(local);
      if (Number.isNaN(customDate.getTime())) {
        throw new Error("Custom deadline is invalid");
      }

      return customDate.toISOString();
    }

    const now = new Date();
    const daysToAdd = deadlinePreset === "1d" ? 1 : deadlinePreset === "2d" ? 2 : deadlinePreset === "3d" ? 3 : 7;
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  };

  const loadGroups = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/group-purchases");
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Failed to load groups";
        throw new Error(message);
      }

      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/group-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: requireUserId(),
          groupId,
          quantity: Number(quantity),
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Failed to join group";
        throw new Error(message);
      }

      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    setLoading(true);
    setError(null);

    try {
      const resolvedDeadline = resolveDeadlineIso();

      const response = await fetch("/api/group-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId: requireUserId(),
          productId,
          targetQuantity: Number(targetQuantity),
          minQuantity: Number(minQuantity),
          discountPrice: discountPrice.trim() ? Number(discountPrice) : undefined,
          deadline: resolvedDeadline,
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Failed to create group";
        throw new Error(message);
      }

      setResult(data);
      await loadGroups();
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
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Group Purchases</h1>
        <p className="text-sm text-slate-600">Route tests for create/join/list via /api/group-purchases.</p>
        <p className="text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Create Group</h2>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select product_id</option>
              {productOptions.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name} ({product.product_id})
                </option>
              ))}
            </select>
            <input value={targetQuantity} onChange={(e) => setTargetQuantity(e.target.value)} placeholder="target quantity" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} placeholder="min quantity" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="discount price (optional)" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <select value={deadlinePreset} onChange={(e) => setDeadlinePreset(e.target.value as DeadlinePreset)} className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2">
              <option value="1d">In 1 day</option>
              <option value="2d">In 2 days</option>
              <option value="3d">In 3 days</option>
              <option value="1w">In 1 week</option>
              <option value="custom">Custom date/time</option>
            </select>
            {deadlinePreset === "custom" && (
              <input
                type="datetime-local"
                value={customDeadlineLocal}
                onChange={(e) => setCustomDeadlineLocal(e.target.value)}
                className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
            )}
          </div>
          <button onClick={() => void createGroup()} disabled={loading} className="mt-3 rounded bg-indigo-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Create Group</button>
        </section>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Join Group</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="groupId" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="quantity" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void loadGroups()} disabled={loading} className="rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Load Active Groups</button>
            <button onClick={() => void joinGroup()} disabled={loading} className="rounded bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Join Group</button>
          </div>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result !== null && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}
