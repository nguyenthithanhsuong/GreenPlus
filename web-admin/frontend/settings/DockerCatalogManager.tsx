"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Kind = "categories" | "catalog-products";
type Row = { category_id?: string; product_id?: string; name: string; price?: number; category_id_ref?: string };
export default function DockerCatalogManager({ storeId, initialKind = "categories", lockedKind = false }: { storeId: string; initialKind?: Kind; lockedKind?: boolean }) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [items, setItems] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = useCallback((id?: string) => `/api/tenant-demo/catalog?${new URLSearchParams({ storeId, kind, ...(id ? { itemId: id } : {}) })}`, [storeId, kind]);
  const reload = useCallback(async () => {
    const res = await fetch(endpoint(), { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load catalog");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, [endpoint]);
  useEffect(() => { if (storeId) void reload().catch((cause) => setError(String(cause))); else setItems([]); }, [storeId, reload]);
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const numericPrice = Number(price);
      if (kind === "catalog-products" && (!Number.isFinite(numericPrice) || numericPrice < 0)) throw new Error("Invalid price");
      const body = kind === "categories" ? { name } : { name, price: numericPrice };
      const res = await fetch(endpoint(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setName(""); await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Create failed"); }
    finally { setBusy(false); }
  }
  async function rename(row: Row) {
    const id = kind === "categories" ? row.category_id : row.product_id;
    if (!id) return;
    const next = window.prompt("Tên mới", row.name);
    if (next === null || !next.trim() || next === row.name) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(endpoint(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: next.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Update failed"); }
    finally { setBusy(false); }
  }
  async function remove(row: Row) {
    const id = kind === "categories" ? row.category_id : row.product_id;
    if (!id || !window.confirm(`Xóa ${row.name}?`)) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(endpoint(id), { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Delete failed"); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-xl border p-4">
    <h2 className="text-lg font-semibold">{kind === "categories" ? "Danh mục Docker" : "Sản phẩm Docker"}</h2>
    {!lockedKind && <select aria-label="Loại dữ liệu" value={kind} onChange={(e) => { setKind(e.target.value as Kind); setError(""); }} className="rounded border p-2">
      <option value="categories">Categories</option><option value="catalog-products">Products</option>
    </select>}
    <form onSubmit={create} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col text-sm">Tên<input required maxLength={100} className="rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} /></label>
      {kind === "catalog-products" && <label className="flex flex-col text-sm">Giá<input required type="number" min="0" step="0.01" className="rounded border p-2" value={price} onChange={(e) => setPrice(e.target.value)} /></label>}
      <button disabled={busy || !storeId} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Thêm</button>
    </form>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <ul className="divide-y">{items.map((row) => <li key={row.category_id || row.product_id} className="flex flex-wrap items-center justify-between gap-3 py-2">
      <span>{row.name}{kind === "catalog-products" ? ` — ${row.price ?? 0}` : ""}</span>
      <div className="flex gap-3"><button disabled={busy} className="text-emerald-700 underline" onClick={() => void rename(row)}>Sửa</button><button disabled={busy} className="text-red-700 underline" onClick={() => void remove(row)}>Xóa</button></div>
    </li>)}</ul>
  </section>;
}
