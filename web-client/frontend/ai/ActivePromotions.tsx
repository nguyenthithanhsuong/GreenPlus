"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Tag } from "lucide-react";
import { selectedStoreId, STORE_CHANGE_EVENT } from "@/lib/stores/store-selection";

type Promotion = {
  id: string;
  scope: string;
  product_id: string;
  product_name: string;
  discount_type: string;
  discount_value: number;
  end_at: string;
  image_url: string | null;
};

export default function ActivePromotions() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // A store switch or refresh cancels any earlier request; stale responses
    // must never overwrite data from the currently selected store.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const store = selectedStoreId();
    if (!store) {
      setError("Chọn cửa hàng để xem khuyến mãi");
      setItems([]);
      setLoading(false);
      requestRef.current = null;
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/promotions?storeId=${encodeURIComponent(store)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(result.error ?? "Không đọc được khuyến mãi");
      setItems(Array.isArray(result.items) ? result.items : []);
      setError("");
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Không đọc được dữ liệu");
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener(STORE_CHANGE_EVENT, load);
    return () => {
      window.removeEventListener(STORE_CHANGE_EVENT, load);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [load]);

  return (
    <main className="mx-auto min-h-screen max-w-[520px] bg-white px-4 pb-28 pt-8">
      <Link href="/dashboard" className="text-sm text-emerald-700">← Trang chủ</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Tag className="text-emerald-700" />Khuyến mãi đang áp dụng</h1>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />Làm mới
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Chỉ hiển thị chương trình đã được Manager phê duyệt. Đơn giá chính thức tính theo lô hàng tại checkout.
      </p>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 space-y-3">
        {items.map(item => (
          <Link key={item.id} href={`/product-detail/${item.product_id}`}
            className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            {item.image_url && (
              <Image unoptimized width={96} height={96} src={item.image_url}
                alt={`Ảnh khuyến mãi ${item.product_name}`}
                className="h-24 w-24 shrink-0 rounded-xl object-cover" />
            )}
            <div>
              <p className="font-bold">{item.product_name}</p>
              <p className="mt-1 text-sm text-emerald-800">
                {item.discount_type === "percentage" ? `${item.discount_value}%` : `${item.discount_value} đ`} giảm · {item.scope === "batch" ? "Chỉ một lô" : "Toàn sản phẩm"}
              </p>
              <p className="mt-2 text-xs text-slate-500">Hết hạn {new Date(item.end_at).toLocaleString("vi-VN")}</p>
            </div>
          </Link>
        ))}
        {!items.length && !error && !loading ? (
          <p className="text-sm text-slate-500">Chưa có khuyến mãi đang hoạt động tại cửa hàng đã chọn.</p>
        ) : null}
      </div>
    </main>
  );
}
