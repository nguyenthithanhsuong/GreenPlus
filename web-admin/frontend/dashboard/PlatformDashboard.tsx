"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  Store,
  MessageSquareWarning,
  RefreshCw,
} from "lucide-react";

type Overview = {
  users: number;
  usersMonth: number;
  usersLast: number;
  totalRevenue: number;
  thisRevenue: number;
  lastRevenue: number;
  pendingSuppliersCount: number;
  pendingSuppliers: Array<{
    supplier_id: string;
    name: string;
    certificate: string | null;
    created_at: string;
  }>;
  pendingComplaints: number;
  pendingPosts: Array<{
    post_id: string;
    title: string;
    content: string;
    type: string;
    created_at: string;
  }>;
  trend: Array<{ key: string; label: string; orders: number; revenue: number }>;
  segments: { vip: number; returning: number; new: number; total: number };
  partial: boolean;
};
const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
const change = (now: number, previous: number) =>
  previous === 0 ? (now === 0 ? 0 : 100) : ((now - previous) / previous) * 100;

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/platform/dashboard", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Không tải được dữ liệu");
      setStats(data as Overview);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được Dashboard");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [refresh]);
  if (loading && !stats)
    return (
      <p className="rounded-xl bg-white p-8 text-center text-slate-600">
        Đang tải Dashboard toàn nền tảng...
      </p>
    );
  const cards = stats
    ? [
        {
          title: "Tổng người dùng",
          value: stats.users.toLocaleString("vi-VN"),
          detail: `${change(stats.usersMonth, stats.usersLast).toFixed(1)}% so với tháng trước`,
          Icon: Users,
        },
        {
          title: "Tổng doanh thu",
          value: money(stats.totalRevenue),
          detail: `${change(stats.thisRevenue, stats.lastRevenue).toFixed(1)}% so với tháng trước`,
          Icon: Wallet,
        },
        {
          title: "Đối tác chờ duyệt",
          value: String(stats.pendingSuppliersCount),
          detail: "Dữ liệu trực tiếp từ suppliers.status = pending",
          Icon: Store,
        },
        {
          title: "Khiếu nại cần xử lý",
          value: String(stats.pendingComplaints),
          detail: "complaints.status = pending",
          Icon: MessageSquareWarning,
        },
      ]
    : [];
  const review = async (id: string, status: "approved" | "rejected") => {
    if (
      !window.confirm(
        status === "approved"
          ? "Xác nhận phê duyệt nhà cung cấp?"
          : "Xác nhận từ chối nhà cung cấp?",
      )
    )
      return;
    try {
      const response = await fetch(
        `/api/platform/suppliers/${encodeURIComponent(id)}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Kiểm duyệt thất bại");
      await refresh(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kiểm duyệt thất bại");
    }
  };
  const max = Math.max(1, ...(stats?.trend ?? []).map((row) => row.revenue));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Tổng hợp tất cả các cửa hàng · Tự cập nhật mỗi 30 giây khi mở trang
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-emerald-700"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {stats?.partial && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Dữ liệu đơn hàng lớn hơn 10.000 bản ghi; các chỉ số doanh thu ở đây có
          thể chưa đầy đủ. Cần triển khai aggregate SQL/RPC.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <section
            key={c.title}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between text-sm font-medium text-slate-500">
              <span>{c.title}</span>
              <c.Icon className="text-emerald-600" size={19} />
            </div>
            <div className="break-words text-2xl font-black text-slate-900">
              {c.value}
            </div>
            <p className="mt-3 text-xs text-slate-500">{c.detail}</p>
          </section>
        ))}
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">
          Tăng trưởng doanh thu và đơn hàng (6 tháng)
        </h2>
        <div className="mt-6 grid grid-cols-6 gap-3">
          {(stats?.trend ?? []).map((item) => (
            <div key={item.key} className="min-w-0 text-center">
              <div className="flex h-44 items-end justify-center rounded-lg bg-slate-50 p-2">
                <div
                  className="w-full max-w-10 rounded-t bg-emerald-500"
                  style={{
                    height: `${Math.max(3, (100 * item.revenue) / max)}%`,
                  }}
                  title={`${money(item.revenue)} / ${item.orders} đơn`}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-600">{item.label}</p>
              <p className="text-[11px] font-semibold text-slate-700">
                {item.orders} đơn
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Chiều cao cột dựa trên tổng giá trị đơn hàng từng tháng.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold">
          Phân khúc khách hàng · {stats?.segments.total ?? 0} khách có đơn
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(
            [
              { key: "returning", label: "Khách hàng cũ (≥ 2 đơn)" },
              { key: "new", label: "Khách hàng mới (1 đơn)" },
              { key: "vip", label: "Khách VIP (top 10% chi tiêu)" },
            ] as const
          ).map((i) => (
            <div key={i.key} className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">{i.label}</p>
              <p className="mt-2 text-2xl font-bold text-emerald-950">
                {stats?.segments.total
                  ? (
                      (stats.segments[i.key] / stats.segments.total) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-bold">Đối tác chờ duyệt</h2>
          <div className="mt-4 space-y-3">
            {stats?.pendingSuppliers.length ? (
              stats.pendingSuppliers.map((s) => (
                <div key={s.supplier_id} className="rounded-xl border p-3">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    Chứng nhận: {s.certificate ?? "Chưa có"} ·{" "}
                    {new Date(s.created_at).toLocaleDateString("vi-VN")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void review(s.supplier_id, "approved")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Phê duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(s.supplier_id, "rejected")}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Không có đối tác chờ duyệt.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Nội dung chờ duyệt</h2>
            <Link href="/greencreators" className="text-sm text-emerald-600">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {stats?.pendingPosts.length ? (
              stats.pendingPosts.map((p) => (
                <div key={p.post_id} className="rounded-xl border p-3">
                  <p className="font-semibold">
                    {p.title || p.content.slice(0, 90) || "Nội dung"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.type} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("vi-VN")}
                  </p>
                  <Link
                    className="text-sm font-semibold text-emerald-600"
                    href="/greencreators"
                  >
                    Xử lý
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Không có nội dung chờ duyệt.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
