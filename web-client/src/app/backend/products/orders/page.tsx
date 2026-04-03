"use client";

import { useEffect, useState } from "react";

type OrderListItem = {
  order_id: string;
  order_date: string;
  status: string;
  status_label: string;
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  note: string | null;
  created_at: string;
};

type OrderListResponse = {
  items: OrderListItem[];
};

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

export default function ProductOrdersTestPage() {
  const [activeUserId, setActiveUserId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("123 Demo Street, HCM City");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [orderNote, setOrderNote] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [cancelNote, setCancelNote] = useState("Customer request");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordersResult, setOrdersResult] = useState<OrderListResponse | null>(null);
  const [detailResult, setDetailResult] = useState<unknown>(null);
  const [mutationResult, setMutationResult] = useState<unknown>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    setActiveUserId(saved);
  }, []);

  const requireUserId = (): string => {
    if (!activeUserId) {
      throw new Error("Please login test user from top-right corner first");
    }

    return activeUserId;
  };

  const listOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = requireUserId();
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
      const data = (await response.json()) as OrderListResponse | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Failed to load orders");
      }

      setOrdersResult(data as OrderListResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = requireUserId();
      if (!selectedOrderId.trim()) {
        throw new Error("orderId is required");
      }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(selectedOrderId.trim())}?userId=${encodeURIComponent(userId)}`
      );
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Failed to load order detail";
        throw new Error(message);
      }

      setDetailResult(data);
    } catch (requestError) {
      setDetailResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = requireUserId();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          deliveryAddress,
          deliveryFee: Number(deliveryFee),
          note: orderNote,
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Failed to create order";
        throw new Error(message);
      }

      setMutationResult(data);
      await listOrders();
    } catch (requestError) {
      setMutationResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = requireUserId();
      if (!selectedOrderId.trim()) {
        throw new Error("orderId is required");
      }

      const response = await fetch(`/api/orders/${encodeURIComponent(selectedOrderId.trim())}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, note: cancelNote }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Failed to cancel order";
        throw new Error(message);
      }

      setMutationResult(data);
      await listOrders();
    } catch (requestError) {
      setMutationResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = requireUserId();
      if (!selectedOrderId.trim()) {
        throw new Error("orderId is required");
      }

      const response = await fetch(`/api/orders/${encodeURIComponent(selectedOrderId.trim())}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          deliveryAddress,
          deliveryFee: Number(deliveryFee),
          note: orderNote,
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Failed to update order";
        throw new Error(message);
      }

      setMutationResult(data);
      await listOrders();
    } catch (requestError) {
      setMutationResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Orders</h1>
        <p className="text-sm text-slate-600">Route tests for create/list/detail/cancel via /api/orders.</p>
        <p className="text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="delivery address"
              className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            />
            <input
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(event.target.value)}
              placeholder="delivery fee"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={orderNote}
              onChange={(event) => setOrderNote(event.target.value)}
              placeholder="order note"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={selectedOrderId}
              onChange={(event) => setSelectedOrderId(event.target.value)}
              placeholder="orderId"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={cancelNote}
              onChange={(event) => setCancelNote(event.target.value)}
              placeholder="cancel note"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void createOrder()} disabled={loading} className="rounded bg-emerald-700 px-3 py-2 text-xs text-white disabled:opacity-60">{loading ? "Processing..." : "Create Order"}</button>
            <button onClick={() => void listOrders()} disabled={loading} className="rounded bg-slate-800 px-3 py-2 text-xs text-white disabled:opacity-60">{loading ? "Loading..." : "Load My Orders"}</button>
            <button onClick={() => void loadDetail()} disabled={loading} className="rounded bg-blue-700 px-3 py-2 text-xs text-white disabled:opacity-60">{loading ? "Loading..." : "Load Detail"}</button>
            <button onClick={() => void updateOrder()} disabled={loading} className="rounded bg-amber-700 px-3 py-2 text-xs text-white disabled:opacity-60">{loading ? "Saving..." : "Update Order"}</button>
            <button onClick={() => void cancelOrder()} disabled={loading} className="rounded bg-rose-700 px-3 py-2 text-xs text-white disabled:opacity-60">{loading ? "Saving..." : "Cancel Order"}</button>
          </div>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {ordersResult !== null && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(ordersResult, null, 2)}</pre>}
        {detailResult !== null && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(detailResult, null, 2)}</pre>}
        {mutationResult !== null && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(mutationResult, null, 2)}</pre>}
      </div>
    </main>
  );
}
