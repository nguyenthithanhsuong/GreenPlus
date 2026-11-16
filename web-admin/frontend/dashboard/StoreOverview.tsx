"use client";
import { useCallback, useEffect, useState } from "react";
import { Building2, Package, ShoppingCart, Tag, Warehouse, RefreshCw } from "lucide-react";

type Store = { store_id: string; name: string; status: string };
type Overview = { store: Store; stats: { products: number; orders: number; promotions: number; inventory: number } };
export default function StoreOverview() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch("/api/stores", { cache: "no-store" }).then(async res => {
      const data = await res.json() as { items?: Store[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể tải cửa hàng");
      if (active) { setStores(data.items ?? []); setSelected(data.items?.[0]?.store_id ?? ""); }
    }).catch(cause => { if(active)setError(cause instanceof Error ? cause.message : "Không thể tải cửa hàng"); });
    return () => { active = false; };
  }, []);
  const reload = useCallback(async () => {
    if(!selected){setResult(null);return;}
    setLoading(true);
    try {
      const res = await fetch(`/api/platform/dashboard/stores?storeId=${encodeURIComponent(selected)}`, { cache: "no-store" });
      const data = await res.json() as Overview & { error?: string };
      if(!res.ok)throw new Error(data.error || "Không thể tải thống kê");
      setResult(data);setError("");
    } catch(cause){setError(cause instanceof Error ? cause.message : "Không thể tải thống kê");setResult(null);}
    finally{setLoading(false);}
  },[selected]);
  useEffect(() => {
    void reload();
    const changed = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("greenplus:data-updated", changed);
    return () => window.removeEventListener("greenplus:data-updated", changed);
  }, [reload]);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <label className="flex-1 text-sm font-semibold text-slate-700">Xem tổng quan cửa hàng
        <select value={selected} onChange={event=>setSelected(event.target.value)} className="mt-2 block w-full max-w-lg rounded-xl border border-slate-200 p-3 text-sm">
          {stores.map(store=><option value={store.store_id} key={store.store_id}>{store.name} · {store.status}</option>)}
        </select>
      </label>
      <button type="button" onClick={()=>void reload()} disabled={!selected||loading} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 disabled:opacity-50"><RefreshCw size={17}/>Làm mới</button>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {result && <><div className="flex items-center gap-3 text-emerald-800"><Building2/><h2 className="text-lg font-bold">{result.store.name}</h2></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Sản phẩm", value: result.stats.products, Icon: Package },
          { title: "Đơn hàng", value: result.stats.orders, Icon: ShoppingCart },
          { title: "Khuyến mãi đang hoạt động", value: result.stats.promotions, Icon: Tag },
          { title: "Bản ghi tồn kho", value: result.stats.inventory, Icon: Warehouse },
        ].map(({title,value,Icon})=><div key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="text-emerald-700" size={22}/><p className="mt-3 text-sm text-slate-500">{title}</p><p className="mt-1 text-3xl font-bold">{value.toLocaleString("vi-VN")}</p></div>)}
      </div>
      <p className="text-sm text-slate-500">Chế độ xem tổng hợp dành cho Admin. Không cung cấp thao tác sửa tồn kho, giá hoặc đơn hàng.</p>
    </>}
  </div>;
}
