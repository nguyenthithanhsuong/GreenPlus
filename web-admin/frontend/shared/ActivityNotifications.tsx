"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, RefreshCw } from "lucide-react";
import { asPortalRole } from "@/lib/portal-access";
import { useAuthStore } from "@/lib/stores/authStore";

type EventData = { action: string; entity: string; createdAt: string };
export default function ActivityNotifications() {
  const role = asPortalRole(useAuthStore(state => state.user?.role_name ?? state.session?.role_name));
  const identity = useAuthStore(state => state.session?.access_token);
  const [events, setEvents] = useState<EventData[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!role || !identity) return;
    const source = new EventSource("/api/activity/stream", { withCredentials: true });
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    const message = (raw: MessageEvent) => {
      try {
        const value = JSON.parse(raw.data) as EventData;
        setEvents(old => [value, ...old].slice(0, 12));
        window.dispatchEvent(new Event("greenplus:data-updated"));
      } catch { /* Ignore an invalid or outdated message. */ }
    };
    source.addEventListener("activity", message);
    return () => { source.removeEventListener("activity", message); source.close(); };
  }, [identity, role]);
  if (!role) return null;
  const unread = Math.max(0, events.length - seen);
  return <div className="relative">
    <button type="button" aria-expanded={open} aria-label={`Thông báo hoạt động${unread ? `, ${unread} mới` : ""}`} onClick={() => { setOpen(x => !x); setSeen(events.length); }} className="relative rounded-full p-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
      <Bell size={21}/>{unread > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold text-white">{unread}</span>}
    </button>
    {open && <section className="absolute right-0 top-12 z-50 w-[min(90vw,360px)] rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl" aria-label="Hoạt động mới">
      <h2 className="flex items-center justify-between text-sm font-bold">Thông báo hoạt động <span className={`text-xs ${connected ? "text-emerald-700" : "text-amber-700"}`}>{connected ? "Đang kết nối" : "Đang kết nối lại"}</span></h2>
      <p className="mt-1 text-xs text-slate-500">Dữ liệu thay đổi của nền tảng/cửa hàng được cập nhật gần thời gian thực.</p>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{events.map((item, i) => <div key={`${item.createdAt}-${i}`} className="rounded-xl bg-slate-50 p-3 text-xs"><p className="font-semibold text-emerald-800">{item.action}</p><p className="text-slate-600">{item.entity} · {new Date(item.createdAt).toLocaleString("vi-VN")}</p></div>)}
      {!events.length && <p className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw size={14}/> Chưa có hoạt động mới trong phiên này.</p>}</div>
      {role !== "employee" && <Link href="/audit" onClick={() => setOpen(false)} className="mt-3 block text-sm font-semibold text-emerald-700 underline">Xem nhật ký hoạt động</Link>}
    </section>}
  </div>;
}
