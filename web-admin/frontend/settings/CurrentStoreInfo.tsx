"use client";

import React from "react";
import { Building2, Clock3, Mail, MapPin, Phone, Store, User } from "lucide-react";
import { useCurrentUserProfile } from "../shared/useCurrentUserProfile";
import type { StoreRow } from "../../backend/modules/stores/stores-management.types";
import type { UserSummary } from "../../backend/modules/users/user-management.types";

const formatTime = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
};

const formatCoordinate = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?[1-9])0+$/, "$1");
};

const CurrentStoreInfo = () => {
  const { profile } = useCurrentUserProfile();
  const [stores, setStores] = React.useState<StoreRow[]>([]);
  const [users, setUsers] = React.useState<UserSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [storesResponse, usersResponse] = await Promise.all([
          fetch("/api/stores", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ]);

        const storesPayload = (await storesResponse.json()) as { items?: StoreRow[]; error?: string };
        const usersPayload = (await usersResponse.json()) as { items?: UserSummary[]; error?: string };

        if (!storesResponse.ok) {
          throw new Error(storesPayload.error ?? "Không thể tải danh sách cửa hàng");
        }

        if (!usersResponse.ok) {
          throw new Error(usersPayload.error ?? "Không thể tải danh sách người dùng");
        }

        if (!active) {
          return;
        }

        setStores(storesPayload.items ?? []);
        setUsers(usersPayload.items ?? []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Không thể tải thông tin cửa hàng");
          setStores([]);
          setUsers([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const currentStore = React.useMemo(() => {
    if (!profile?.storeId) {
      return null;
    }

    return stores.find((store) => store.store_id === profile.storeId) ?? null;
  }, [profile?.storeId, stores]);

  const managerNameById = React.useMemo(() => {
    return new Map(users.map((user) => [user.user_id, user.name]));
  }, [users]);

  const managerName = currentStore ? managerNameById.get(currentStore.manager_id) ?? currentStore.manager_id : "-";

  const statusMeta = React.useMemo(() => {
    if (!currentStore) {
      return null;
    }

    if (currentStore.status === "active") {
      return { label: "Đang hoạt động", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }

    if (currentStore.status === "inactive") {
      return { label: "Tạm ngưng", className: "bg-amber-50 text-amber-700 border-amber-200" };
    }

    return { label: "Đã đóng", className: "bg-slate-50 text-slate-700 border-slate-200" };
  }, [currentStore]);

  if (!profile?.storeId) {
    return (
      <div className="flex-1 rounded-xl border border-dashed border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-gray-50 p-3 text-gray-500">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Cửa hàng của tôi</h2>
            <p className="text-sm text-gray-500">Tài khoản hiện tại chưa được gán `store_id`.</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Khi gán cửa hàng cho user hiện tại, thông tin cửa hàng sẽ xuất hiện ở đây.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Đang tải thông tin cửa hàng hiện tại...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm text-sm text-amber-800">
        Không tìm thấy cửa hàng tương ứng với `store_id` hiện tại.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cửa hàng hiện tại</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">{currentStore.name}</h2>
              <p className="mt-2 text-sm text-gray-500">Mã cửa hàng: {currentStore.store_id}</p>
            </div>
          </div>

          {statusMeta ? (
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gray-50 p-3 text-gray-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Trạng thái</p>
              <p className="text-sm font-bold text-gray-900">{statusMeta?.label ?? '-'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gray-50 p-3 text-gray-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quản lý</p>
              <p className="text-sm font-bold text-gray-900">{managerName}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gray-50 p-3 text-gray-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Giờ mở cửa</p>
              <p className="text-sm font-bold text-gray-900">{formatTime(currentStore.opening_time)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gray-50 p-3 text-gray-600">
              <Clock3 className="h-5 w-5 rotate-90" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Giờ đóng cửa</p>
              <p className="text-sm font-bold text-gray-900">{formatTime(currentStore.closing_time)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Thông tin chi tiết</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Địa chỉ</p>
            <p className="mt-2 text-sm text-gray-800">{currentStore.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Khu vực</p>
            <p className="mt-2 text-sm text-gray-800">
              {[currentStore.ward, currentStore.district, currentStore.city].filter(Boolean).join(', ') || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Số điện thoại</p>
            <p className="mt-2 text-sm text-gray-800">{currentStore.phone ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
            <p className="mt-2 text-sm text-gray-800">{currentStore.email ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mô tả</p>
            <p className="mt-2 text-sm text-gray-800">{currentStore.description ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tọa độ</p>
            <p className="mt-2 text-sm text-gray-800">
              {formatCoordinate(currentStore.latitude)}, {formatCoordinate(currentStore.longitude)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Liên hệ nhanh</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-4">
            <Phone className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hotline</p>
              <p className="text-sm font-medium text-gray-900">{currentStore.phone ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-4">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900">{currentStore.email ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-4">
            <MapPin className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Địa chỉ</p>
              <p className="text-sm font-medium text-gray-900">{currentStore.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentStoreInfo;