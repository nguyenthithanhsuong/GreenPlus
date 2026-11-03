"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DockerCatalogManager from "./DockerCatalogManager";

type Kind = "categories" | "catalog-products";
type Store = { store_id: string; name: string; tier: string; slot: string };

/** The main Admin catalog pages use this workspace ONLY when Docker Local is selected. */
export default function DockerCatalogWorkspace({ kind }: { kind: Kind }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tenant-demo", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || "Không thể tải cửa hàng Docker");
        return value as { items?: Store[] };
      })
      .then(({ items }) => {
        const next = Array.isArray(items) ? items : [];
        setStores(next);
        setStoreId((current) => next.some((item) => item.store_id === current) ? current : (next[0]?.store_id ?? ""));
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Docker không khả dụng"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <main className="mx-auto max-w-5xl space-y-5 p-6 text-slate-800">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">{kind === "categories" ? "Danh mục" : "Sản phẩm"}</h1><p className="text-sm text-emerald-700">Docker Local</p></div>
      <Link href="/settings" className="text-sm text-emerald-700 underline">Nguồn dữ liệu</Link>
    </div>
    {loading ? <p>Đang tải cửa hàng Docker...</p> : null}
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    {!loading && !error && stores.length === 0 ? <p>Chưa có cửa hàng Docker. <Link href="/settings/tenant-demo" className="underline">Tạo cửa hàng thử nghiệm</Link></p> : null}
    {stores.length > 0 ? <label className="flex max-w-md flex-col gap-2 text-sm">Cửa hàng Docker
      <select value={storeId} onChange={(event) => setStoreId(event.target.value)} className="rounded border px-3 py-2">
        {stores.map((store) => <option key={store.store_id} value={store.store_id}>{store.name} ({store.tier})</option>)}
      </select>
    </label> : null}
    {storeId ? <DockerCatalogManager key={`${storeId}:${kind}`} storeId={storeId} initialKind={kind} lockedKind /> : null}
  </main>;
}
