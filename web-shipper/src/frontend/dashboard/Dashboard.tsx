"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AlertCircle, CalendarCheck2, CheckCheck, CheckCircle2, ClipboardList, Clock3,
  LoaderCircle, MapPin, Navigation2, PackageCheck, RefreshCw, Truck, Wallet,
} from "lucide-react";
import ShipperShell from "../shared/ShipperShell";
import Modal from "../shared/Modal";
import StatusBadge from "../shared/StatusBadge";
import type { Delivery } from "../../lib/delivery-types";

const DeliveryMapPanel = dynamic(() => import("../map/DeliveryMapPanel"), { ssr: false });

type Tab = "assigned" | "in_progress" | "delivered";
const nextStatus: Record<Delivery["status"], Delivery["status"] | null> = {
  assigned: "picked_up", picked_up: "delivering", delivering: "delivered", delivered: null,
};
const tabs = [
  { key: "assigned", label: "Chờ lấy", icon: Clock3 },
  { key: "in_progress", label: "Đang giao", icon: Truck },
  { key: "delivered", label: "Lịch sử", icon: CheckCheck },
] as const;
const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Delivery[]>([]);
  const [name, setName] = useState("Shipper");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("assigned");
  const [mapOrder, setMapOrder] = useState<string | null>(null);
  const [confirmDelivery, setConfirmDelivery] = useState<Delivery | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [auth, list] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/shipper/deliveries", { cache: "no-store" }),
      ]);
      if (auth.status === 401 || list.status === 401) { router.replace("/login"); return; }
      const [profile, data] = await Promise.all([auth.json(), list.json()]);
      if (!auth.ok || !list.ok) throw new Error(data.error || profile.error || "Không tải được danh sách giao hàng");
      setName(profile.user?.name || "Shipper");
      setItems(Array.isArray(data.items) ? data.items : []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được đơn hàng");
    } finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function advance(item: Delivery, confirmed = false) {
    const next = nextStatus[item.status];
    if (!next || busyId) return;
    if (next === "delivered" && !confirmed) { setConfirmDelivery(item); return; }
    setBusyId(item.order_id);
    setError("");
    try {
      const response = await fetch(`/api/shipper/deliveries/${encodeURIComponent(item.order_id)}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStatus: item.status, status: next }),
      });
      const data = await response.json();
      if (response.status === 401) { router.replace("/login"); return; }
      if (!response.ok) throw new Error(data.error || "Cập nhật thất bại");
      setItems((old) => old.map((entry) => entry.order_id === item.order_id ? data : entry));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật thất bại");
      await load(true);
    } finally { setBusyId(null); }
  }

  const counts = {
    assigned: items.filter((item) => item.status === "assigned").length,
    in_progress: items.filter((item) => item.status === "picked_up" || item.status === "delivering").length,
    delivered: items.filter((item) => item.status === "delivered").length,
  };
  const visible = items.filter((item) => tab === "assigned" ? item.status === "assigned"
    : tab === "delivered" ? item.status === "delivered"
      : item.status === "picked_up" || item.status === "delivering");

  return (
    <ShipperShell title="Đơn giao của tôi" description="Theo dõi và xử lý các đơn hàng được phân công" icon={ClipboardList}
      action={<button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="gp-icon-button" aria-label="Tải lại danh sách">
        <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
      </button>}>
      <section className="gp-card relative overflow-hidden p-4" aria-label="Tổng quan giao hàng">
        <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full bg-emerald-50/80" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Truck size={23} /></span>
          <div><p className="gp-muted">Chào mừng trở lại,</p><h2 className="text-xl font-extrabold text-slate-800">{name}</h2></div>
        </div>
        <p className="gp-muted relative mt-3">Các chỉ số tính từ danh sách đơn được tải (tối đa 100 đơn gần nhất).</p>
        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {([{ key: "assigned", label: "Chờ lấy", icon: Clock3, color: "bg-amber-50 text-amber-700" },
            { key: "in_progress", label: "Đang giao", icon: Truck, color: "bg-blue-50 text-blue-700" },
            { key: "delivered", label: "Đã giao", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700" }] as const)
          .map(({ key, label, icon: Icon, color }) => (
            <div key={key} className={`min-w-0 rounded-2xl p-3.5 sm:p-4 ${color}`}>
              <Icon className="mb-2 opacity-75" size={19} />
              <p className="text-2xl font-extrabold tabular-nums">{counts[key]}</p>
              <p className="mt-1 text-xs font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6" aria-label="Danh sách đơn hàng">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-extrabold text-slate-800">Danh sách đơn hàng</h2>
            {/* <p className="gp-muted mt-1">Cập nhật tự động mỗi 20 giây khi trang đang mở</p></div> */}
          <span className="text-xs font-semibold text-slate-500">{loading ? "Đang tải..." : `${visible.length} đơn`}</span>
        </div>
        <div className="gp-tabs" role="tablist" aria-label="Lọc trạng thái đơn">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button type="button" key={key} role="tab" aria-selected={tab === key}
              className={`gp-tab ${tab === key ? "gp-tab-active" : ""}`} onClick={() => setTab(key)}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </div>
        {error && <div role="alert" className="gp-alert mt-4"><AlertCircle size={18} />{error}</div>}
        <div role="tabpanel" className="mt-4 min-h-[280px]">
          {loading ? (
            <div className="gp-card gp-empty-state"><LoaderCircle size={35} className="mb-4 animate-spin text-emerald-600" /><p>Đang tải danh sách giao hàng...</p></div>
          ) : visible.length === 0 ? (
            <div className="gp-card gp-empty-state">
              <span className="gp-empty-state-icon"><CalendarCheck2 size={29} /></span>
              <h3>{tab === "delivered" ? "Chưa có lịch sử giao hàng" : "Chưa có đơn trong trạng thái này."}</h3>
              <p>Đơn được phân công hoặc cập nhật trạng thái sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {visible.map((item) => (
                <article key={item.delivery_id} className="gp-card flex min-w-0 flex-col p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="gp-kicker">MÃ ĐƠN HÀNG</p><h3 className="mt-1 text-lg font-extrabold text-slate-800">#{item.order_id.slice(0, 8)}</h3></div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 flex-1 space-y-3 border-t border-slate-100 pt-4">
                    <p className="flex items-center gap-2 text-sm font-bold"><PackageCheck size={17} className="text-emerald-600" />{item.customer_name}</p>
                    <p className="flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin size={17} className="mt-1 shrink-0 text-emerald-600" />{item.delivery_address || "Chưa có địa chỉ giao hàng"}</p>
                    <p className="flex items-center gap-2 text-sm text-slate-600"><Wallet size={17} className="text-emerald-600" /><span>Giá trị đơn: <strong className="text-slate-800">{money(item.total_amount)}</strong></span></p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button type="button" className="gp-secondary-button" onClick={() => setMapOrder(item.order_id)}><Navigation2 size={16} /> Bản đồ</button>
                    {nextStatus[item.status] && (
                      <button type="button" disabled={busyId !== null} onClick={() => void advance(item)} className="gp-primary-button flex-1">
                        {busyId === item.order_id ? <LoaderCircle size={16} className="animate-spin" />
                          : item.status === "delivering" ? <CheckCircle2 size={16} /> : <PackageCheck size={16} />}
                        {item.status === "assigned" ? "Đã lấy hàng" : item.status === "picked_up" ? "Bắt đầu giao" : "Giao thành công"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      {confirmDelivery && <Modal title="Xác nhận giao hàng" description={`Đơn #${confirmDelivery.order_id.slice(0, 8)}`} icon={CheckCircle2}
        onClose={() => { if (!busyId) setConfirmDelivery(null); }}
        footer={<><button type="button" className="gp-secondary-button" disabled={busyId !== null} onClick={() => setConfirmDelivery(null)}>Hủy</button>
          <button type="button" className="gp-primary-button" disabled={busyId !== null} onClick={() => { const item = confirmDelivery; setConfirmDelivery(null); void advance(item, true); }}><CheckCircle2 size={16} /> Xác nhận đã giao</button></>}>
        <p className="text-sm leading-6 text-slate-600">Xác nhận bạn đã giao đơn hàng thành công. Ảnh minh chứng và đối soát COD chưa được tích hợp.</p>
      </Modal>}
      {mapOrder && <DeliveryMapPanel orderId={mapOrder} onClose={() => setMapOrder(null)} />}
    </ShipperShell>
  );
}
