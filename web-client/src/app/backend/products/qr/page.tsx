"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type QrResult = {
  product_name: string;
  supplier_name: string | null;
  production_location: string | null;
  harvest_date: string;
  expire_date: string;
  certification: string | null;
  batch_number: string;
};

type ProductOption = {
  product_id: string;
  name: string;
};

type BatchOption = {
  batch_id: string;
  product_id: string;
};

export default function ProductQrTestPage() {
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [qrCode, setQrCode] = useState("product_id=&batch_id=");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QrResult | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch("/api/testing/options");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          products?: ProductOption[];
          batches?: BatchOption[];
        };

        const products = payload.products ?? [];
        const batches = payload.batches ?? [];

        setProductOptions(products);
        setBatchOptions(batches);

        if (products.length > 0) {
          setProductId(products[0].product_id);
        }
      } catch {
        // Khong chan test page neu options load that bai.
      }
    };

    void loadOptions();
  }, []);

  const filteredBatches = useMemo(
    () => batchOptions.filter((batch) => !productId || batch.product_id === productId),
    [batchOptions, productId]
  );

  useEffect(() => {
    if (filteredBatches.length > 0) {
      setBatchId((current) => {
        const stillExists = filteredBatches.some((batch) => batch.batch_id === current);
        return stillExists ? current : filteredBatches[0].batch_id;
      });
    } else {
      setBatchId("");
    }
  }, [filteredBatches]);

  useEffect(() => {
    setQrCode(`product_id=${productId}&batch_id=${batchId}`);
  }, [productId, batchId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/traceability/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });

      const data = (await response.json()) as QrResult | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Scan failed");
      }

      setResult(data as QrResult);
    } catch (scanError) {
      setResult(null);
      setError(scanError instanceof Error ? scanError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Scan QR Product Origin</h1>
        <p className="text-sm text-slate-600">Route test for use case 26 via /api/traceability/scan.</p>

        <form onSubmit={submit} className="rounded border border-slate-300 bg-white p-4">
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select product_id</option>
              {productOptions.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name} ({product.product_id})
                </option>
              ))}
            </select>

            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select batch_id</option>
              {filteredBatches.map((batch) => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {batch.batch_id}
                </option>
              ))}
            </select>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-800">QR payload</label>
          <input
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="product_id=...&batch_id=..."
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? "Scanning..." : "Scan QR"}
          </button>
        </form>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result && (
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
