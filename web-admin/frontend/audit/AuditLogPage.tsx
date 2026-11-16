"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, ShieldCheck } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { asPortalRole, canAccessPage } from "@/lib/portal-access";

type AuditRow = {
  id: string; store_id: string | null; actor_id: string | null;
  action: string; entity: string; entity_id: string | null;
  before_data: Record<string, unknown> | null; after_data: Record<string, unknown> | null;
  created_at: string; actor_name?: string; store_name?: string;
};
type Result = { items: AuditRow[]; total: number; page: number; pageSize: number; error?: string };
const date = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const entities = ["", "stores", "products", "inventory", "prices", "orders", "promotions", "promotion", "ai_suggestions", "ai_conversations"];
export default function AuditLogPage() {
  const role = asPortalRole(useAuthStore(s => s.user?.role_name ?? s.session?.role_name));
  const [stores, setStores] = useState<{store_id:string;name:string}[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/stores", { cache: "no-store", signal: controller.signal }).then(res => res.json()).then((body: { items?: {store_id:string;name:string}[] }) => {
      if (!controller.signal.aborted) setStores(body.items ?? []);
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Result>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), size: "20" });
    if (search) params.set("search", search);
    if (entity) params.set("entity", entity);
    if (action) params.set("action", action);
    if (storeId) params.set("storeId", storeId);
    if (from) params.set("from", new Date(`${from}T00:00:00+07:00`).toISOString());
    if (to) params.set("to", new Date(`${to}T23:59:59+07:00`).toISOString());
    try {
      const response = await fetch(`/api/audit?${params}`, { cache: "no-store", signal });
      const result = await response.json() as Result;
      if (!response.ok) throw new Error(result.error || "Không thể tải nhật ký");
      if (!signal?.aborted) { setData(result); setError(""); }
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Không thể tải nhật ký");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [page, search, entity, action, storeId, from, to]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("greenplus:data-updated", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener("greenplus:data-updated", refresh); window.clearInterval(timer); };
  }, [load]);
  const update = (change: () => void) => { setPage(1); change(); };
  const input = "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-2 focus:outline-emerald-600";
  return <AdminShell title="Nhật ký hoạt động" description="Theo dõi các thay đổi trên nền tảng và cửa hàng theo quyền truy cập; dữ liệu được ghi tự động từ cơ sở dữ liệu." pageActions={
    <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60"><RefreshCw size={16} /> Làm mới</button>
  }>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <form onSubmit={(event) => { event.preventDefault(); update(() => setSearch(searchInput.trim())); }} className="flex flex-col gap-3 md:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={17} className="text-slate-400"/><input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Tìm theo hành động hoặc nhóm dữ liệu" className="w-full border-0 py-2.5 text-sm outline-none" /></label>
        <button className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">Tìm kiếm</button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-semibold text-slate-500">Nhóm dữ liệu<select className={`mt-1 w-full ${input}`} value={entity} onChange={e => update(() => setEntity(e.target.value))}>{entities.map(v => <option key={v} value={v}>{v || "Tất cả nhóm"}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500">Hành động<input className={`mt-1 w-full ${input}`} value={action} onChange={e => update(() => setAction(e.target.value))} placeholder="Ví dụ: update" /></label>
        <label className="text-xs font-semibold text-slate-500">Cửa hàng<select className={`mt-1 w-full ${input}`} value={storeId} onChange={e => update(() => setStoreId(e.target.value))}><option value="">Tất cả cửa hàng được phép xem</option>{stores.map(store => <option value={store.store_id} key={store.store_id}>{store.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500">Từ ngày<input className={`mt-1 w-full ${input}`} type="date" value={from} onChange={e => update(() => setFrom(e.target.value))} /></label>
        <label className="text-xs font-semibold text-slate-500">Đến ngày<input className={`mt-1 w-full ${input}`} type="date" value={to} onChange={e => update(() => setTo(e.target.value))} /></label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </div>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3 text-sm"><span className="flex items-center gap-2 font-semibold text-slate-800"><ShieldCheck size={18} className="text-emerald-700"/> {data.total.toLocaleString("vi-VN")} sự kiện</span><span className="text-slate-500">{loading ? "Đang cập nhật..." : "Mới nhất trước"}</span></div>
      <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Đối tượng</th><th className="px-4 py-3">Người thực hiện</th><th className="px-4 py-3">Thay đổi (đã lọc)</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{data.items.map(item => <tr key={item.id} className="align-top hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 text-slate-600">{date(item.created_at)}</td><td className="px-4 py-3 font-medium text-emerald-800">{item.action}</td><td className="px-4 py-3"><span className="font-medium">{item.entity}</span><span className="block text-xs text-slate-500">{item.store_name ?? "Cửa hàng"}</span>{(() => {
          const target = ({ stores: "/settings/stores", products: "/products", inventory: "/inventories", prices: "/prices", orders: "/orders", promotions: "/prices" } as Record<string,string>)[item.entity];
          return target && role && canAccessPage(role,target) ? <Link href={target} className="text-xs font-medium text-emerald-700 underline">Xem trong {item.entity}</Link> : null;
        })()}</td><td className="px-4 py-3 text-slate-600">{item.actor_id && role && canAccessPage(role,"/users") ? <Link href="/users" className="font-medium text-emerald-700 underline">{item.actor_name || "Tài khoản"}</Link> : item.actor_name || "Hệ thống"}</td><td className="max-w-[310px] px-4 py-3 text-xs text-slate-600"><details><summary className="cursor-pointer text-emerald-700">Xem chi tiết</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-2">{JSON.stringify({ before: item.before_data, after: item.after_data }, null, 2)}</pre></details></td></tr>)}
        {!data.items.length && !loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Không tìm thấy sự kiện phù hợp.</td></tr>}</tbody>
      </table>
      <div className="flex items-center justify-end gap-3 border-t p-4 text-sm"><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage(x=>x-1)}>Trước</button><span>Trang {page} / {Math.max(1,Math.ceil(data.total / 20))}</span><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={page * 20 >= data.total || loading} onClick={() => setPage(x=>x+1)}>Sau</button></div>
    </div>
  </AdminShell>;
}
