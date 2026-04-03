"use client";

import Link from "next/link";
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

export default function BackendOrdersTestPage() {
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
      throw new Error("Please set active test user in /backend/signin first");
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

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h1 className="text-2xl font-bold">Backend Test: Orders</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use this page to test create order, track order list/detail, and cancel order.
          </p>
          <p className="mt-1 text-xs text-slate-500">Route: /backend/orders</p>
          <p className="mt-1 text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/backend/products/cart" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Cart Test
            </Link>
            <Link href="/backend/products" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Product Backend Test
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Create Order From Cart</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void createOrder()}
              disabled={loading}
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Processing..." : "Create Order"}
            </button>
            <button
              onClick={() => void listOrders()}
              disabled={loading}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load My Orders"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Track / Cancel Order</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void loadDetail()}
              disabled={loading}
              className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load Order Detail"}
            </button>
            <button
              onClick={() => void cancelOrder()}
              disabled={loading}
              className="rounded bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : "Cancel Order"}
            </button>
          </div>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}

        {ordersResult !== null && (
          <section className="rounded-xl border border-slate-300 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-800">Order List Result</h3>
            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(ordersResult, null, 2)}
            </pre>
          </section>
        )}

        {detailResult !== null && (
          <section className="rounded-xl border border-slate-300 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-800">Order Detail Result</h3>
            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(detailResult, null, 2)}
            </pre>
          </section>
        )}

        {mutationResult !== null && (
          <section className="rounded-xl border border-slate-300 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-800">Mutation Result</h3>
            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(mutationResult, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}
