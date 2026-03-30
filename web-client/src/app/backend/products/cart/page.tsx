"use client";

import { useEffect, useState } from "react";

type CartItem = {
  cart_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  note: string | null;
  product_price: number | null;
  subtotal: number;
};

type CartView = {
  user_id: string;
  cart_id: string;
  items: CartItem[];
  cart_total: number;
};

type ProductOption = {
  product_id: string;
  name: string;
};

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

export default function ProductCartTestPage() {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [activeUserId, setActiveUserId] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartView | null>(null);

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

  const request = async (path: string, method: string, body?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = (await response.json()) as CartView | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Request failed");
      }

      setCart(data as CartView);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Cart and Shopping Notes</h1>
        <p className="text-sm text-slate-600">Route tests for use case 27 and 28 via /api/cart and /api/cart/note.</p>
        <p className="text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select product_id</option>
              {productOptions.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name} ({product.product_id})
                </option>
              ))}
            </select>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="quantity" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void request(`/api/cart?userId=${encodeURIComponent(requireLoggedInUserId())}`, "GET")} disabled={loading} className="rounded bg-slate-800 px-3 py-2 text-xs text-white">Get Cart</button>
            <button onClick={() => void request("/api/cart", "POST", { userId: requireLoggedInUserId(), productId, quantity: Number(quantity) })} disabled={loading} className="rounded bg-emerald-700 px-3 py-2 text-xs text-white">Add Item</button>
            <button onClick={() => void request("/api/cart", "PUT", { userId: requireLoggedInUserId(), productId, quantity: Number(quantity) })} disabled={loading} className="rounded bg-amber-700 px-3 py-2 text-xs text-white">Update Qty</button>
            <button onClick={() => void request("/api/cart", "DELETE", { userId: requireLoggedInUserId(), productId })} disabled={loading} className="rounded bg-rose-700 px-3 py-2 text-xs text-white">Remove Item</button>
            <button onClick={() => void request("/api/cart/note", "PUT", { userId: requireLoggedInUserId(), productId, note })} disabled={loading} className="rounded bg-blue-700 px-3 py-2 text-xs text-white">Save Note</button>
          </div>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {cart && (
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(cart, null, 2)}</pre>
        )}
      </div>
    </main>
  );
}
