"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import RoleDrawer, { RoleFormValues } from "./RoleDrawer";
import RoleGrid from "./RoleGrid";
import type { RoleSummary } from "../../backend/modules/roles/role-management.types";
import { roleSearchStrategy } from "../shared/searchStrategies";

const emptyForm = (): RoleFormValues => ({
  roleName: "",
  description: "",
});

const RoleManagement = () => {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleSummary | null>(null);
  const [form, setForm] = useState<RoleFormValues>(emptyForm());
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/roles", { cache: "no-store" });
      const data = (await response.json()) as { items?: RoleSummary[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load roles");
      }

      setRoles(data.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  const stats = useMemo(() => ({
    total: roles.length,
    assignedUsers: roles.reduce((sum, role) => sum + role.user_count, 0),
  }), [roles]);

  const filteredRoles = useMemo(
    () => roleSearchStrategy.filter(roles, deferredSearchQuery),
    [deferredSearchQuery, roles]
  );

  const openCreateDrawer = () => {
    setSelectedRole(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEditDrawer = (role: RoleSummary) => {
    setSelectedRole(role);
    setForm({
      roleName: role.role_name,
      description: role.description ?? "",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRole(null);
    setForm(emptyForm());
  };

  const submitRole = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(selectedRole ? `/api/roles/${selectedRole.role_id}` : "/api/roles", {
        method: selectedRole ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: form.roleName,
          description: form.description,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save role");
      }

      closeDrawer();
      await loadRoles();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: RoleSummary) => {
    if (!window.confirm(`Xóa role "${role.role_name}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/roles/${role.role_id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete role");
      }

      await loadRoles();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Quản lý vai trò"
      description="Thiết lập vai trò và phạm vi truy cập cho từng nhóm người dùng."
      searchPlaceholder="Tìm kiếm vai trò..."
      pageActions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="text"
              placeholder="Tìm role theo tên, mô tả..."
              className="h-9 w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadRoles()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#047857] disabled:opacity-60"
            disabled={loading || saving}
          >
            <Plus className="h-4 w-4" />
            Thêm role
          </button>
        </div>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Tổng role</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</h3>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Kết quả tìm kiếm</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{filteredRoles.length}</h3>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">User được gán</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{stats.assignedUsers}</h3>
        </div>
      </div>

      <RoleGrid
        roles={filteredRoles}
        loading={loading}
        saving={saving}
        onEditRole={openEditDrawer}
        onDeleteRole={deleteRole}
        emptyMessage={searchQuery.trim() ? "Không tìm thấy role phù hợp." : "Chưa có role nào."}
      />

      <RoleDrawer
        isOpen={drawerOpen}
        saving={saving}
        error={error}
        form={form}
        selectedRole={selectedRole}
        onClose={closeDrawer}
        onSubmit={() => {
          void submitRole();
        }}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
    </AdminShell>
  );
};

export default RoleManagement;