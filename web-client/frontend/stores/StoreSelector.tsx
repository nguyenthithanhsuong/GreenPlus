"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, LocateFixed, MapPin, Store as StoreIcon, X } from "lucide-react";
import {
  type ActiveStore,
  nearestStore,
  selectStore,
  selectedStoreId,
} from "@/lib/stores/store-selection";

export default function StoreSelector() {
  const [stores, setStores] = useState<ActiveStore[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggested, setSuggested] = useState<string | null>(null);

  const choose = useCallback((storeId: string) => {
    setId(storeId);
    selectStore(storeId);
    setOpen(false);
    setError("");
  }, []);

  const recommend = useCallback((list: ActiveStore[], askPermission: boolean, isActive: () => boolean = () => true) => {
    if (!list.length) return;
    if (!navigator.geolocation) {
      if (askPermission) setError("Trình duyệt không hỗ trợ vị trí.");
      return;
    }

    const locate = () => {
      if (!isActive()) return;
      if (askPermission) {
        setBusy(true);
        setError("");
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isActive()) return;
          const closest = nearestStore(list, position.coords);
          if (!closest) {
            if (askPermission) setError("Chưa có cửa hàng nào có tọa độ hợp lệ.");
          } else {
            setSuggested(closest.store.store_id);
            // Do not replace a saved, valid store choice with a GPS suggestion.
            const saved = selectedStoreId();
            if (!list.some((store) => store.store_id === saved)) {
              setId(closest.store.store_id);
              selectStore(closest.store.store_id);
            }
          }
          if (askPermission) setBusy(false);
        },
        () => {
          if (!isActive()) return;
          if (askPermission) {
            setError("Không lấy được vị trí. Bạn có thể chọn cửa hàng thủ công.");
            setBusy(false);
          }
        },
        { enableHighAccuracy: false, timeout: 9000, maximumAge: 60_000 },
      );
    };

    if (askPermission) {
      // The user clicked the GPS button: permission may be requested here.
      locate();
      return;
    }

    // Auto-suggest only when permission has already been granted. Do not prompt on mount.
    if (!("permissions" in navigator)) return;
    void navigator.permissions.query({ name: "geolocation" })
      .then((permission) => {
        if (permission.state === "granted" && isActive()) locate();
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/stores", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được cửa hàng");
        return response.json();
      })
      .then((data: { items?: ActiveStore[] }) => {
        if (!active) return;
        const list = Array.isArray(data.items) ? data.items : [];
        setStores(list);
        const saved = selectedStoreId();
        const chosen = list.find((store) => store.store_id === saved)
          ?? (list.length === 1 ? list[0] : null);
        if (chosen) {
          setId(chosen.store_id);
          if (saved !== chosen.store_id) selectStore(chosen.store_id);
        }
        // Started after async API resolution, not synchronously in an effect.
        if (list.length > 1) recommend(list, false, () => active);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Không tải được cửa hàng");
      });
    return () => { active = false; };
  }, [recommend]);

  const chosen = stores.find((store) => store.store_id === id);

  return (
    <div className="relative w-full">
      <button type="button" onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
        aria-label="Chọn cửa hàng mua sắm">
        <MapPin size={18} className="shrink-0 text-emerald-600" />
        <span className="max-w-[230px] truncate">{chosen?.name || "Chọn cửa hàng mua sắm"}</span>
        <ChevronDown size={17} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5"
          onClick={() => setOpen(false)}>
          <section role="dialog" aria-modal="true" aria-label="Chọn cửa hàng"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-emerald-950">Mua sắm tại cửa hàng</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng"><X /></button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Giá và tồn kho có thể khác nhau giữa các cửa hàng.</p>
            <button type="button" onClick={() => recommend(stores, true)} disabled={busy || stores.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 font-semibold text-emerald-700 disabled:opacity-50">
              <LocateFixed size={18} />{busy ? "Đang tìm cửa hàng..." : "Gợi ý cửa hàng gần tôi"}
            </button>
            {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
            <ul className="mt-4 space-y-3">
              {stores.map((store) => (
                <li key={store.store_id}>
                  <button type="button" onClick={() => choose(store.store_id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${id === store.store_id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <StoreIcon size={20} className="mt-1 shrink-0 text-emerald-600" />
                    <span>
                      <span className="block font-bold text-slate-800">{store.name}
                        {suggested === store.store_id && (
                          <span className="ml-2 rounded-full bg-lime-200 px-2 py-0.5 text-xs text-emerald-900">Gần nhất (đường chim bay)</span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {[store.address, store.ward, store.district, store.city].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {stores.length === 0 && <p className="py-6 text-center text-slate-500">Không có cửa hàng đang hoạt động.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
