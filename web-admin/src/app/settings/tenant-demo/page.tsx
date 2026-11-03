"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import DockerCatalogManager from "../../../../frontend/settings/DockerCatalogManager";

type Tier = "regular" | "pro" | "enterprise";
type Store = { store_id: string; name: string; tier: Tier; slot: string };

export default function TenantDemoPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("regular");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState("");
  async function refresh() {
    const response = await fetch("/api/tenant-demo", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Không tải được danh sách");
    setStores(json.items || []);
  }
  useEffect(() => {
    void refresh().catch((e) => setError(String(e)));
  }, []);
  async function create(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/tenant-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tier }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Provisioning failed");
      setName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-slate-800">
      <Link href="/settings/stores" className="text-emerald-700 underline">
        Quay lại quản lý cửa hàng
      </Link>
      <h1 className="text-2xl font-bold">Docker multi-tenancy sandbox</h1>
      <p>
        Thử tạo tenant thực trên Docker. Đây là môi trường thí nghiệm tách biệt,{" "}
        <strong>không phải cửa hàng sản xuất</strong> và chưa hỗ trợ checkout,
        Admin/Client/Shipper xuyên database.
      </p>
      <form
        onSubmit={create}
        className="flex flex-wrap gap-3 rounded-xl border p-4"
      >
        <label className="flex flex-col gap-1">
          Tên cửa hàng
          <input
            required
            minLength={2}
            maxLength={120}
            className="rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Loại phân vùng
          <select
            className="rounded border px-3 py-2"
            value={tier}
            onChange={(e) => setTier(e.target.value as Tier)}
          >
            <option value="regular">Regular — Shared</option>
            <option value="pro">Pro — Separate Schema</option>
            <option value="enterprise">Enterprise — Database per Tenant</option>
          </select>
        </label>
        <button
          disabled={loading}
          className="self-end rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Đang tạo..." : "Tạo tenant demo"}
        </button>
      </form>
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      <div className="space-y-2">
        {stores.map((store) => (
          <div key={store.store_id} className="rounded border p-3">
            <strong>{store.name}</strong> — {store.tier} / {store.slot}
            <p className="break-all text-xs text-slate-500">{store.store_id}</p>
          </div>
        ))}
      </div>
      <label className="flex flex-col gap-1">Cửa hàng Docker
        <select className="rounded border p-2" value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
          <option value="">Chọn cửa hàng</option>
          {stores.map((store) => <option key={store.store_id} value={store.store_id}>{store.name} ({store.tier})</option>)}
        </select>
      </label>
      {selectedStore && <DockerCatalogManager storeId={selectedStore} />}
    </main>
  );
}
