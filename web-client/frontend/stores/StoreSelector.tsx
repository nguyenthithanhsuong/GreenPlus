"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  LocateFixed,
  MapPin,
  Store as StoreIcon,
  X,
  Search,
} from "lucide-react";
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
  const [address, setAddress] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");

  const choose = useCallback((storeId: string) => {
    setId(storeId);
    selectStore(storeId);
    setOpen(false);
    setError("");
  }, []);

  const recommend = useCallback(
    (
      list: ActiveStore[],
      askPermission: boolean,
      isActive: () => boolean = () => true,
    ) => {
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
              if (askPermission)
                setError("Chưa có cửa hàng nào có tọa độ hợp lệ.");
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
              setError(
                "Không lấy được vị trí. Bạn có thể chọn cửa hàng thủ công.",
              );
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
      void navigator.permissions
        .query({ name: "geolocation" })
        .then((permission) => {
          if (permission.state === "granted" && isActive()) locate();
        })
        .catch(() => {});
    },
    [],
  );

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
        const chosen =
          list.find((store) => store.store_id === saved) ??
          (list.length === 1 ? list[0] : null);
        if (chosen) {
          setId(chosen.store_id);
          if (saved !== chosen.store_id) selectStore(chosen.store_id);
        }
        // Started after async API resolution, not synchronously in an effect.
        if (list.length > 1) recommend(list, false, () => active);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Không tải được cửa hàng",
          );
      });
    return () => {
      active = false;
    };
  }, [recommend]);

  const locateFromAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address.trim()) return;
    setBusy(true);
    setError("");
    try {
      const coordinates =
        /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(
          address.trim(),
        );
      if (coordinates) {
        const latitude = Number(coordinates[1]),
          longitude = Number(coordinates[2]);
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
          throw new Error("Tọa độ không hợp lệ.");
        const closest = nearestStore(stores, { latitude, longitude });
        if (!closest) throw new Error("Cửa hàng chưa có tọa độ hợp lệ.");
        setSuggested(closest.store.store_id);
        setResolvedAddress(`Tọa độ ${latitude}, ${longitude}`);
        return;
      }
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(address.trim())}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        items?: Array<{ latitude: number; longitude: number; label: string }>;
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Không thể tra cứu địa chỉ");
      const location = payload.items?.[0];
      if (!location)
        throw new Error(
          "Không tìm thấy địa chỉ. Hãy thêm phường, quận và thành phố.",
        );
      const closest = nearestStore(stores, location);
      if (!closest) throw new Error("Cửa hàng chưa có tọa độ hợp lệ.");
      setResolvedAddress(location.label);
      setSuggested(closest.store.store_id);
      // Suggestion only: changing store is always confirmed by the customer.
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không tìm thấy địa chỉ",
      );
    } finally {
      setBusy(false);
    }
  };

  const chosen = stores.find((store) => store.store_id === id);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
        aria-label="Chọn cửa hàng mua sắm"
      >
        <MapPin size={18} className="shrink-0 text-emerald-600" />
        <span className="max-w-[230px] truncate">
          {chosen?.name || "Chọn cửa hàng mua sắm"}
        </span>
        <ChevronDown size={17} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[5000] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Chọn cửa hàng"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-emerald-950">
                Mua sắm tại cửa hàng
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                <X />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Giá và tồn kho có thể khác nhau giữa các cửa hàng.
            </p>
            <button
              type="button"
              onClick={() => recommend(stores, true)}
              disabled={busy || stores.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 font-semibold text-emerald-700 disabled:opacity-50"
            >
              <LocateFixed size={18} />
              {busy ? "Đang tìm cửa hàng..." : "Gợi ý cửa hàng gần tôi"}
            </button>
            <form
              onSubmit={(event) => void locateFromAddress(event)}
              className="mt-3 flex flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="manual-address" className="sr-only">
                Nhập vị trí của bạn
              </label>
              <input
                id="manual-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Địa chỉ hoặc 10.82, 106.74"
                autoComplete="street-address"
                maxLength={160}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !address.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Search size={17} />
                Tìm địa chỉ
              </button>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              Không cần bật GPS: nhập địa chỉ (cần Mapbox API) hoặc tọa độ để
              nhận gợi ý. Bạn vẫn tự chọn cửa hàng bên dưới. Khoảng cách gợi ý
              là đường chim bay, không phải phí ship.
            </p>
            {resolvedAddress && (
              <p className="mt-2 text-sm text-emerald-700">
                Địa chỉ tìm thấy: {resolvedAddress}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-rose-600">
                {error}
              </p>
            )}
            <ul className="mt-4 space-y-3">
              {stores.map((store) => (
                <li key={store.store_id}>
                  <button
                    type="button"
                    onClick={() => choose(store.store_id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${id === store.store_id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <StoreIcon
                      size={20}
                      className="mt-1 shrink-0 text-emerald-600"
                    />
                    <span>
                      <span className="block font-bold text-slate-800">
                        {store.name}
                        {suggested === store.store_id && (
                          <span className="ml-2 rounded-full bg-lime-200 px-2 py-0.5 text-xs text-emerald-900">
                            Gần nhất (đường chim bay)
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {[store.address, store.ward, store.district, store.city]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {stores.length === 0 && (
              <p className="py-6 text-center text-slate-500">
                Không có cửa hàng đang hoạt động.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
