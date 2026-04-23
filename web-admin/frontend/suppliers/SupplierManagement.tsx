"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import SupplierStats from "./SupplierStats";
import SupplierTable from "./SupplierTable";
import type { SupplierRow, SupplierStatus } from "../../backend/modules/suppliers/supplier-management.types";

type SupplierFormState = {
  name: string;
  address: string;
  certificate: string;
  description: string;
  status: SupplierStatus;
};

const emptyForm = (): SupplierFormState => ({
  name: "",
  address: "",
  certificate: "",
  description: "",
  status: "pending",
});

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRow | null>(null);
  const [form, setForm] = useState<SupplierFormState>(emptyForm());

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/suppliers", { cache: "no-store" });
      const data = (await response.json()) as { items?: SupplierRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load suppliers");
      }

      setSuppliers(data.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const stats = useMemo(() => ({
    total: suppliers.length,
    approved: suppliers.filter((supplier) => supplier.status === "approved").length,
    pending: suppliers.filter((supplier) => supplier.status === "pending").length,
    rejected: suppliers.filter((supplier) => supplier.status === "rejected").length,
  }), [suppliers]);

  const openCreateForm = () => {
    setEditingSupplier(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEditForm = (supplier: SupplierRow) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      address: supplier.address,
      certificate: supplier.certificate ?? "",
      description: supplier.description ?? "",
      status: supplier.status,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingSupplier(null);
    setForm(emptyForm());
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(editingSupplier ? `/api/suppliers/${editingSupplier.supplier_id}` : "/api/suppliers", {
        method: editingSupplier ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          certificate: form.certificate,
          description: form.description,
          status: form.status,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save supplier");
      }

      closeForm();
      await loadSuppliers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (supplier: SupplierRow, action: "approve" | "reject") => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/suppliers/${supplier.supplier_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to update supplier status");
      }

      await loadSuppliers();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async (supplier: SupplierRow) => {
    if (!window.confirm(`Xóa supplier "${supplier.name}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/suppliers/${supplier.supplier_id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete supplier");
      }

      await loadSuppliers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Quản lý nhà cung cấp"
      description="Danh sách đối tác, nông trại phân phối thực phẩm sạch trên hệ thống."
      searchPlaceholder="Tìm kiếm nhà cung cấp bằng tên, mô tả..."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadSuppliers()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#047857] disabled:opacity-60"
            disabled={loading || saving}
          >
            <Plus className="h-4 w-4" />
            Thêm supplier
          </button>
        </div>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <SupplierStats {...stats} />

      <SupplierTable
        suppliers={suppliers}
        loading={loading}
        saving={saving}
        onEdit={openEditForm}
        onDelete={deleteSupplier}
        onApprove={(supplier) => {
          void changeStatus(supplier, "approve");
        }}
        onReject={(supplier) => {
          void changeStatus(supplier, "reject");
        }}
      />

      {formOpen && (
        <div className={`fixed inset-0 z-50 ${formOpen ? "" : "pointer-events-none"}`}>
          <button
            type="button"
            className={`absolute inset-0 bg-black/35 transition-opacity ${formOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeForm}
            aria-label="Đóng"
          />

          <aside
            className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-300 ${
              formOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col font-sans">
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSupplier ? "Chỉnh sửa Supplier" : "Thêm Supplier mới"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {error ? (
                  <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <form
                  className="space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitForm(event);
                  }}
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Tên supplier <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      type="text"
                      placeholder="Ví dụ: Green Farm Củ Chi"
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      type="text"
                      placeholder="Nhập địa chỉ supplier"
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Trạng thái</label>
                      <select
                        value={form.status}
                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SupplierStatus }))}
                        className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Certificate</label>
                      <input
                        value={form.certificate}
                        onChange={(event) => setForm((current) => ({ ...current, certificate: event.target.value }))}
                        type="text"
                        placeholder="URL hoặc mã chứng nhận"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">Mô tả</label>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Mô tả ngắn về supplier"
                      rows={4}
                      className="w-full resize-none rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
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
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-md bg-[#1da453] px-4 py-2 text-sm font-semibold text-white hover:bg-[#178546] disabled:opacity-60"
                    >
                      {saving ? "Đang lưu..." : editingSupplier ? "Cập nhật" : "Tạo supplier"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  );
};

export default SupplierManagement;