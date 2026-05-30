"use client";

import { useState } from "react";

export default function LoyaltyTestPage() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const award = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/loyalty/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Request failed";
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

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Loyalty Points</h1>
        <p className="text-sm text-slate-600">Route test via /api/loyalty/award.</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="orderId" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button onClick={() => void award()} disabled={loading} className="mt-3 rounded bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Award Loyalty Points</button>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result !== null && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}
