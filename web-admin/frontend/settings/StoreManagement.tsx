"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Building2, Clock3, Edit, Mail, MapPin, Phone, Plus, RefreshCw, Search, Store, Trash2, X } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import SettingsNav from "./SettingsNav";
import { useCurrentUserProfile } from "../shared/useCurrentUserProfile";
import { usePermissions } from "@/lib/usePermissions";
import ConfirmActionDialog from "../users/ConfirmActionDialog";
import type { StoreRow, StoreStatus } from "../../backend/modules/stores/stores-management.types";
import type { UserSummary } from "../../backend/modules/users/user-management.types";

type StoreFormState = {
  name: string;
  description: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  phone: string;
  email: string;
  managerId: string;
  status: StoreStatus;
  latitude: string;
  longitude: string;
  openingTime: string;
  closingTime: string;
};

const emptyForm = (managerId = ""): StoreFormState => ({
  name: "",
  description: "",
  address: "",
  ward: "",
  district: "",
  city: "",
  phone: "",
  email: "",
  managerId,
  status: "active",
  latitude: "",
  longitude: "",
  openingTime: "",
  closingTime: "",
});

function formatTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

function formatCoordinate(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?[1-9])0+$/, "$1");
}

function getStatusChip(status: StoreStatus) {
  if (status === "active") {
    return {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "Đang hoạt động",
    };
  }

  if (status === "inactive") {
    return {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      label: "Tạm ngưng",
    };
  }

  return {
    border: "border-slate-200",
    bg: "bg-slate-50",
    text: "text-slate-700",
    dot: "bg-slate-500",
    label: "Đã đóng",
  };
}

const StoreManagement = () => {
  const { profile } = useCurrentUserProfile();
  const { hasPermission, loading: permLoading } = usePermissions();
  const canModify = !permLoading && (hasPermission('stores.create') || hasPermission('stores.update'));
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRow | null>(null);
  const [pendingDeleteStore, setPendingDeleteStore] = useState<StoreRow | null>(null);
  const [form, setForm] = useState<StoreFormState>(emptyForm());

  const loadStores = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stores", { cache: "no-store" });
      const payload = (await response.json()) as { items?: StoreRow[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể tải danh sách cửa hàng");
      }

      setStores(payload.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách cửa hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const payload = (await response.json()) as { items?: UserSummary[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể tải danh sách quản lý");
      }

      setUsers(payload.items ?? []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    void Promise.all([loadStores(), loadUsers()]);
  }, []);

  const managerNameById = useMemo(() => {
    return new Map(users.map((user) => [user.user_id, user.name]));
  }, [users]);

  const managerOptions = useMemo(() => {
    return [...users].sort((left, right) => left.name.localeCompare(right.name));
  }, [users]);

  const getManagerDisplayName = (managerId: string) => {
    return managerNameById.get(managerId) ?? managerId ?? "Chưa có";
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredStores = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return stores;
    }

    return stores.filter((store) => {
      const haystack = [
        store.name,
        store.description ?? "",
        store.address,
        store.ward ?? "",
        store.district ?? "",
        store.city ?? "",
        store.phone ?? "",
        store.email ?? "",
        getManagerDisplayName(store.manager_id),
        store.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredSearchQuery, getManagerDisplayName, stores]);

  const stats = useMemo(
    () => ({
      total: stores.length,
      active: stores.filter((store) => store.status === "active").length,
      inactive: stores.filter((store) => store.status === "inactive").length,
      closed: stores.filter((store) => store.status === "closed").length,
    }),
    [stores],
  );

  const openCreateForm = () => {
    setEditingStore(null);
    setForm(emptyForm(profile?.userId ?? ""));
    setFormOpen(true);
    setSuccessMessage(null);
  };

  const openEditForm = (store: StoreRow) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      description: store.description ?? "",
      address: store.address,
      ward: store.ward ?? "",
      district: store.district ?? "",
      city: store.city ?? "",
      phone: store.phone ?? "",
      email: store.email ?? "",
      managerId: store.manager_id,
      status: store.status,
      latitude: store.latitude === null ? "" : String(store.latitude),
      longitude: store.longitude === null ? "" : String(store.longitude),
      openingTime: store.opening_time ? store.opening_time.slice(0, 5) : "",
      closingTime: store.closing_time ? store.closing_time.slice(0, 5) : "",
    });
    setFormOpen(true);
    setSuccessMessage(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingStore(null);
    setForm(emptyForm(profile?.userId ?? ""));
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(editingStore ? `/api/stores/${editingStore.store_id}` : "/api/stores", {
        method: editingStore ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          address: form.address,
          ward: form.ward,
          district: form.district,
          city: form.city,
          phone: form.phone,
          email: form.email,
          managerId: form.managerId,
          status: form.status,
          latitude: form.latitude,
          longitude: form.longitude,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể lưu thông tin cửa hàng");
      }

      setSuccessMessage(editingStore ? "Đã cập nhật cửa hàng." : "Đã tạo cửa hàng mới.");
      closeForm();
      await loadStores();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể lưu thông tin cửa hàng");
    } finally {
      setSaving(false);
    }
  };

  const deleteStore = async (store: StoreRow) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/stores/${store.store_id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể xóa cửa hàng");
      }

      setPendingDeleteStore(null);
      setSuccessMessage(`Đã xóa cửa hàng ${store.name}.`);
      await loadStores();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa cửa hàng");
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteStore = (store: StoreRow) => {
    setPendingDeleteStore(store);
  };

  return (
    <AdminShell
      title="Cài đặt cửa hàng"
      description="Thêm, sửa và xóa thông tin cửa hàng trong mục cài đặt."
      searchPlaceholder="Tìm kiếm cửa hàng..."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadStores()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
          {!permLoading && hasPermission('stores.create') && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#047857] disabled:opacity-60"
              disabled={loading || saving}
            >
              <Plus className="h-4 w-4" />
              Thêm cửa hàng
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <SettingsNav />

        <div className="min-w-0 flex-1 space-y-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gray-50 p-3">
                  <Store className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tổng cửa hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-emerald-50 p-3">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-amber-50 p-3">
                  <Clock3 className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tạm ngưng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-slate-50 p-3">
                  <Trash2 className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Đã đóng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Danh sách cửa hàng</h2>
                <p className="text-sm text-gray-500">Quản lý thông tin địa chỉ, liên hệ và thời gian hoạt động.</p>
              </div>

              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  type="text"
                  placeholder="Tìm cửa hàng theo tên, địa chỉ, liên hệ..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Cửa hàng</th>
                    <th className="px-5 py-4 font-medium">Địa chỉ</th>
                    <th className="px-5 py-4 font-medium">Liên hệ</th>
                    <th className="px-5 py-4 font-medium">Quản lý</th>
                    <th className="px-5 py-4 font-medium">Giờ mở / đóng</th>
                    <th className="px-5 py-4 font-medium">Trạng thái</th>
                    <th className="px-5 py-4 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-5 py-12 text-center text-gray-500" colSpan={7}>
                        Đang tải danh sách cửa hàng...
                      </td>
                    </tr>
                  ) : filteredStores.length === 0 ? (
                    <tr>
                      <td className="px-5 py-12 text-center text-gray-500" colSpan={7}>
                        {searchQuery.trim() ? "Không tìm thấy cửa hàng phù hợp." : "Chưa có cửa hàng nào."}
                      </td>
                    </tr>
                  ) : (
                    filteredStores.map((store) => {
                      const statusChip = getStatusChip(store.status);
                      return (
                        <tr key={store.store_id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/60">
                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-col gap-1">
                              <p className="font-semibold text-gray-900">{store.name}</p>
                              <p className="line-clamp-2 text-xs text-gray-500">{store.description || "Chưa có mô tả"}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-gray-700">
                            <div className="flex flex-col gap-1">
                              <span>{store.address}</span>
                              <span className="text-xs text-gray-500">
                                {[store.ward, store.district, store.city].filter(Boolean).join(", ") || "Chưa có khu vực"}
                              </span>
                              <span className="text-xs text-gray-500">
                                <MapPin className="mr-1 inline-block h-3.5 w-3.5 align-[-2px] text-gray-400" />
                                {formatCoordinate(store.latitude)}, {formatCoordinate(store.longitude)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-gray-700">
                            <div className="flex flex-col gap-1 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {store.phone || "Chưa có"}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                {store.email || "Chưa có"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-gray-700">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-gray-900">{getManagerDisplayName(store.manager_id)}</span>
                              <span className="text-xs text-gray-500">{store.manager_id}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-gray-700">
                            <div className="flex flex-col gap-1 text-sm">
                              <span>{formatTime(store.opening_time)}</span>
                              <span className="text-xs text-gray-500">đến {formatTime(store.closing_time)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusChip.border} ${statusChip.bg} ${statusChip.text}`}>
                              <span className={`h-2 w-2 rounded-full ${statusChip.dot}`} />
                              {statusChip.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!permLoading && hasPermission('stores.update') && (
                                <button
                                  type="button"
                                  onClick={() => openEditForm(store)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  Sửa
                                </button>
                              )}

                              {!permLoading && hasPermission('stores.delete') && (
                                <button
                                  type="button"
                                  onClick={() => requestDeleteStore(store)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Xóa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>

      <ConfirmActionDialog
        open={Boolean(pendingDeleteStore)}
        title="Xác nhận xóa cửa hàng"
        message={pendingDeleteStore ? `Bạn có chắc muốn xóa cửa hàng ${pendingDeleteStore.name}?` : ""}
        confirmLabel="Xóa cửa hàng"
        confirmVariant="danger"
        loading={saving}
        onCancel={() => setPendingDeleteStore(null)}
        onConfirm={() => {
          if (!pendingDeleteStore) {
            return;
          }

          void deleteStore(pendingDeleteStore);
        }}
      />

      {formOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={closeForm}
            aria-label="Đóng"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl transition-transform duration-300">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingStore ? "Chỉnh sửa cửa hàng" : "Thêm cửa hàng mới"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Cập nhật thông tin vận hành, liên hệ và thời gian mở cửa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form
                  className="space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitForm(event);
                  }}
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">
                        Tên cửa hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        type="text"
                        placeholder="Ví dụ: GreenPlus Quận 7"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Trạng thái</label>
                      <select
                        value={form.status}
                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StoreStatus }))}
                        className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">Mô tả</label>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Mô tả ngắn về cửa hàng"
                      rows={3}
                      className="w-full resize-none rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">
                        Địa chỉ <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.address}
                        onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                        type="text"
                        placeholder="Số nhà, tên đường"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">
                        Manager <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.managerId}
                        onChange={(event) => setForm((current) => ({ ...current, managerId: event.target.value }))}
                        disabled={!canModify}
                        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453] disabled:opacity-60"
                      >
                        <option value="">Chọn manager</option>
                        {managerOptions.map((user) => (
                          <option key={user.user_id} value={user.user_id}>
                            {user.name} {user.email ? `- ${user.email}` : ""}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-gray-500">
                        {form.managerId ? `Đang chọn: ${getManagerDisplayName(form.managerId)}` : "Chọn người quản lý cửa hàng"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Phường / Xã</label>
                      <input
                        value={form.ward}
                        onChange={(event) => setForm((current) => ({ ...current, ward: event.target.value }))}
                        type="text"
                        placeholder="Phường / Xã"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Quận / Huyện</label>
                      <input
                        value={form.district}
                        onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
                        type="text"
                        placeholder="Quận / Huyện"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Tỉnh / Thành phố</label>
                      <input
                        value={form.city}
                        onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                        type="text"
                        placeholder="Tỉnh / Thành phố"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Số điện thoại</label>
                      <input
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        type="text"
                        placeholder="Ví dụ: 0901234567"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Email</label>
                      <input
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        type="email"
                        placeholder="store@greenplus.vn"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Latitude</label>
                      <input
                        value={form.latitude}
                        onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))}
                        type="number"
                        step="any"
                        placeholder="10.762622"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Longitude</label>
                      <input
                        value={form.longitude}
                        onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))}
                        type="number"
                        step="any"
                        placeholder="106.660172"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Giờ mở cửa</label>
                      <input
                        value={form.openingTime}
                        onChange={(event) => setForm((current) => ({ ...current, openingTime: event.target.value }))}
                        type="time"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Giờ đóng cửa</label>
                      <input
                        value={form.closingTime}
                        onChange={(event) => setForm((current) => ({ ...current, closingTime: event.target.value }))}
                        type="time"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saving}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Hủy
                    </button>

                    {(!permLoading && ((editingStore && hasPermission('stores.update')) || (!editingStore && hasPermission('stores.create')))) && (
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-[#1da453] px-4 py-2 text-sm font-semibold text-white hover:bg-[#178546] disabled:opacity-60"
                      >
                        {saving ? "Đang lưu..." : editingStore ? "Cập nhật" : "Tạo cửa hàng"}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </AdminShell>
  );
};

export default StoreManagement;