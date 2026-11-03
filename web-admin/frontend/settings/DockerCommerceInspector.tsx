"use client";

import { useCallback, useEffect, useState } from "react";
import DockerCommerceActions from "./DockerCommerceActions";

type Stock = { store_id: string; product_id: string; available: number; updated_at: string };
type Order = { store_id: string; order_id: string; status: string; payment_status: string; total: number; created_at: string };

/** Read-only Docker sandbox inspector. Never issues inventory or checkout mutations. */
export default function DockerCommerceInspector({ storeId, initialTab = "inventory" }: { storeId: string; initialTab?: "inventory" | "orders" }) {
  const [tab, setTab] = useState<"inventory" | "orders">(initialTab);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<{assigned_to:string;status:string}|null>(null);
  const [events, setEvents] = useState<{action:string;created_at:string}[]>([]);
  const [revision,setRevision]=useState(0);
  const [lines, setLines] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([]);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!storeId) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/tenant-demo/commerce?${new URLSearchParams({ storeId, kind: tab })}`, {cache:"no-store", signal});
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Không thể đọc dữ liệu Docker");
      if (!Array.isArray(payload.items) || payload.items.some((row: Stock | Order) => row.store_id !== storeId)) throw new Error("Dữ liệu cửa hàng không hợp lệ");
      if (tab === "inventory") setStocks(payload.items);
      else setOrders(payload.items);
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Docker không khả dụng");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [storeId,tab]);
  useEffect(() => { const ctrl = new AbortController(); setSelected(null); setLines([]); setDelivery(null);setEvents([]); void refresh(ctrl.signal); return () => ctrl.abort(); }, [refresh,revision]);
  async function showOrder(order: Order) {
    setError(""); setSelected(null);
    try {
      const response = await fetch(`/api/tenant-demo/commerce?${new URLSearchParams({ storeId, kind:"orders",orderId:order.order_id })}`, {cache:"no-store"});
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Không thể tải chi tiết đơn");
      const row = payload.items?.[0];
      if (!row || row.store_id !== storeId || row.order_id !== order.order_id || !Array.isArray(row.lines)) throw new Error("Chi tiết đơn không hợp lệ");
      setSelected(order); setLines(row.lines);setDelivery(row.delivery ?? null);setEvents(Array.isArray(row.events)?row.events:[]);
    } catch (cause) {setError(cause instanceof Error ? cause.message : "Không thể tải đơn");}
  }
  return <section className="space-y-3 rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Tồn kho & đơn hàng Docker</h2><button type="button" disabled={loading} onClick={() => void refresh()} className="rounded border px-3 py-2 disabled:opacity-50">Làm mới</button></div>
    <div className="flex gap-2"><button type="button" aria-pressed={tab==="inventory"} className="rounded border px-3 py-2" onClick={() => setTab("inventory")}>Tồn kho</button><button type="button" aria-pressed={tab==="orders"} className="rounded border px-3 py-2" onClick={() => setTab("orders")}>Đơn hàng</button></div>
    {loading && <p>Đang tải dữ liệu...</p>}{error && <p role="alert" className="text-red-700">{error}</p>}
    {tab === "inventory" ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Product ID</th><th className="p-2">Tồn kho</th><th className="p-2">Cập nhật</th></tr></thead><tbody>{stocks.map(row=><tr key={row.product_id} className="border-t"><td className="p-2 break-all">{row.product_id}</td><td className="p-2">{row.available}</td><td className="p-2">{new Date(row.updated_at).toLocaleString("vi-VN")}</td></tr>)}</tbody></table>{!stocks.length && !loading && <p className="text-sm">Chưa có tồn kho.</p>}</div> : <div className="space-y-2">{orders.map(row=><button type="button" key={row.order_id} className="block w-full rounded border p-3 text-left text-sm" onClick={() => void showOrder(row)}><span className="font-medium">{row.order_id}</span> · {row.status} / {row.payment_status} · {Number(row.total).toLocaleString("vi-VN")} VND</button>)}{!orders.length && !loading && <p className="text-sm">Chưa có đơn hàng.</p>}</div>}
    {tab === "orders" && selected && <div className="rounded border p-3"><p className="font-medium">Chi tiết: {selected.order_id}</p><ul className="space-y-1 text-sm">{lines.map(row=><li key={row.product_id}>{row.product_id} — {row.quantity} × {Number(row.unit_price).toLocaleString("vi-VN")}</li>)}</ul>{delivery && <p>Giao hàng: {delivery.status} — {delivery.assigned_to}</p>}{events.length > 0 && <p className="text-xs">Lịch sử: {events.map(e=>e.action).join(" → ")}</p>}</div>}
    <DockerCommerceActions storeId={storeId} onSuccess={()=>setRevision(n=>n+1)}/>
    <p className="text-xs text-slate-500">Local Docker sandbox, không tác động Supabase Online.</p>
  </section>;
}
