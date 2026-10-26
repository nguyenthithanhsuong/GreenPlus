"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  CheckCircle2,
  Navigation,
  LoaderCircle,
  CalendarCheck,
} from "lucide-react";
import NavigationBar from "./NavigationBar";
import type { Delivery } from "../../lib/delivery-types";

type Tab = "assigned" | "in_progress" | "delivered";
const captions = {
  assigned: "Chờ lấy hàng",
  picked_up: "Đã lấy hàng",
  delivering: "Đang giao",
  delivered: "Hoàn thành",
};
const nextStatus: Record<Delivery["status"], Delivery["status"] | null> = {
  assigned: "picked_up",
  picked_up: "delivering",
  delivering: "delivered",
  delivered: null,
};
export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Delivery[]>([]);
  const [name, setName] = useState("Shipper");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("assigned");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [auth, list] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/shipper/deliveries", { cache: "no-store" }),
      ]);
      if (auth.status === 401 || list.status === 401) {
        router.replace("/login");
        return;
      }
      const profile = await auth.json();
      const data = await list.json();
      if (!auth.ok || !list.ok)
        throw new Error(
          data.error || profile.error || "Không tải được thông tin",
        );
      setName(profile.user?.name || "Shipper");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    void load();
  }, [load]);
  async function advance(item: Delivery) {
    const next = nextStatus[item.status];
    if (!next || busyId) return;
    if (
      next === "delivered" &&
      !window.confirm(
        "Xác nhận đã giao thành công? Chức năng ảnh minh chứng/COD chưa được tích hợp.",
      )
    )
      return;
    setBusyId(item.order_id);
    setError("");
    try {
      const response = await fetch(
        `/api/shipper/deliveries/${encodeURIComponent(item.order_id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentStatus: item.status, status: next }),
        },
      );
      const data = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Cập nhật thất bại");
      setItems((list) =>
        list.map((x) => (x.order_id === item.order_id ? data : x)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật thất bại");
      await load();
    } finally {
      setBusyId(null);
    }
  }
  const visible = items.filter((i) =>
    tab === "assigned"
      ? i.status === "assigned"
      : tab === "delivered"
        ? i.status === "delivered"
        : ["picked_up", "delivering"].includes(i.status),
  );
  const counts = {
    assigned: items.filter((x) => x.status === "assigned").length,
    in_progress: items.filter(
      (x) => x.status === "picked_up" || x.status === "delivering",
    ).length,
    delivered: items.filter((x) => x.status === "delivered").length,
  };
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_40%_0%,#bbf7d0,#f0fdf4_40%,#f8fafc_100%)] text-slate-800">
      <div className="mx-auto min-h-dvh max-w-[540px] bg-[#f8faf9] pb-28 shadow-xl">
        <header className="rounded-b-[32px] bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500 px-6 pb-8 pt-11 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100">Chào mừng trở lại,</p>
              <h1 className="mt-1 text-2xl font-bold">{name}</h1>
            </div>
            <span className="rounded-2xl bg-white/20 p-3">
              <Truck size={28} />
            </span>
          </div>
          <p className="mt-3 text-sm text-emerald-50">
            Đơn hàng của bạn hôm nay
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {(
              [
                { key: "assigned", label: "Chờ lấy" },
                { key: "in_progress", label: "Đang giao" },
                { key: "delivered", label: "Đã giao" },
              ] as const
            ).map((t) => (
              <div
                className="rounded-2xl bg-white/15 p-3 text-center"
                key={t.key}
              >
                <p className="text-2xl font-black">{counts[t.key]}</p>
                <p className="text-xs text-emerald-50">{t.label}</p>
              </div>
            ))}
          </div>
        </header>
        <div className="mx-4 mt-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Danh sách giao hàng</h2>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Tải lại danh sách"
            className="rounded-xl bg-white p-2.5 text-emerald-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="mx-4 mt-4 grid grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
          {(
            [
              { key: "assigned", label: "Chờ lấy" },
              { key: "in_progress", label: "Đang giao" },
              { key: "delivered", label: "Lịch sử" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`rounded-xl py-3 text-sm font-semibold ${tab === t.key ? "bg-emerald-600 text-white" : "text-slate-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {error && (
          <p
            role="alert"
            className="mx-4 mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        <section aria-label="Đơn của tôi" className="space-y-4 px-4 py-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
              <LoaderCircle className="animate-spin" />
              Đang tải đơn...
            </div>
          ) : !visible.length ? (
            <div className="rounded-3xl bg-white p-10 text-center text-slate-500">
              <CalendarCheck
                className="mx-auto mb-4 text-emerald-500"
                size={44}
              />
              Chưa có đơn trong mục này.
            </div>
          ) : (
            visible.map((item) => (
              <article
                key={item.delivery_id}
                className="rounded-3xl border border-emerald-50 bg-white p-5 shadow-[0_10px_35px_-25px_#047857]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Đơn hàng
                    </p>
                    <h3 className="mt-1 font-bold">
                      #{item.order_id.slice(0, 8)}
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {captions[item.status]}
                  </span>
                </div>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <p className="font-semibold">{item.customer_name}</p>
                  <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                    <MapPin
                      className="mt-1 shrink-0 text-emerald-600"
                      size={17}
                    />
                    {item.delivery_address || "Chưa có địa chỉ giao"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Giá trị đơn:{" "}
                    <strong className="text-slate-800">
                      {item.total_amount.toLocaleString("vi-VN")} ₫
                    </strong>
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  {item.delivery_address && (
                    <a
                      className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.delivery_address)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation size={17} />
                      Bản đồ
                    </a>
                  )}
                  {nextStatus[item.status] && (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void advance(item)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {busyId === item.order_id ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : item.status === "delivering" ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <PackageCheck size={17} />
                      )}
                      {item.status === "assigned"
                        ? "Đã lấy hàng"
                        : item.status === "picked_up"
                          ? "Bắt đầu giao"
                          : "Giao thành công"}
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
        <NavigationBar />
      </div>
    </main>
  );
}
