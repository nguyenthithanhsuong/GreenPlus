"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import BatchDrawer, { BatchFormValues } from "./BatchDrawer";
import BatchStats from "./BatchStats";
import BatchTable from "./BatchTable";
import type { BatchRow } from "../../backend/modules/batches/batch-management.types";
import type { ProductRow } from "../../backend/modules/catalog/product-management.types";
import type { SupplierRow } from "../../backend/modules/suppliers/supplier-management.types";

type OptionRow = {
  id: string;
  label: string;
};

const emptyForm = (): BatchFormValues => ({
  productId: "",
  supplierId: "",
  harvestDate: "",
  expireDate: "",
  quantity: 0,
  qrCode: "",
  status: "pending",
});

const daysUntilExpire = (expireDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expire = new Date(`${expireDate}T00:00:00`);
  expire.setHours(0, 0, 0, 0);

  return Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const deriveBatchStatus = (batch: BatchRow): BatchRow["status"] => {
  if (batch.status === "pending") {
    return "pending";
  }

  if (batch.quantity <= 0) {
    return "sold_out";
  }

  if (daysUntilExpire(batch.expire_date) < 0) {
    return "expired";
  }

  return "available";
};

const BatchManagement = () => {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [form, setForm] = useState<BatchFormValues>(emptyForm());

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/batches", { cache: "no-store" });
      const data = (await response.json()) as { items?: BatchRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách batch");
      }

      setBatches(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách batch");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = (await response.json()) as { items?: ProductRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách sản phẩm");
      }

      setProducts(Array.isArray(data.items) ? data.items : []);
    } catch {
      setProducts([]);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetch("/api/suppliers", { cache: "no-store" });
      const data = (await response.json()) as { items?: SupplierRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách nhà cung cấp");
      }

      setSuppliers(Array.isArray(data.items) ? data.items : []);
    } catch {
      setSuppliers([]);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
    void loadProducts();
    void loadSuppliers();
  }, [loadBatches, loadProducts, loadSuppliers]);

  const stats = useMemo(() => {
    const availableBatches = batches.filter((batch) => deriveBatchStatus(batch) === "available").length;
    const expiringSoonBatches = batches.filter((batch) => {
      if (deriveBatchStatus(batch) !== "available") {
        return false;
      }

      const daysLeft = daysUntilExpire(batch.expire_date);
      return daysLeft >= 0 && daysLeft <= 3;
    }).length;

    const problemBatches = batches.filter((batch) => {
      const status = deriveBatchStatus(batch);
      return status === "expired" || status === "sold_out";
    }).length;

    return {
      totalBatches: batches.length,
      availableBatches,
      expiringSoonBatches,
      problemBatches,
    };
  }, [batches]);

  const productOptions = useMemo<OptionRow[]>(() => products.map((product) => ({ id: product.product_id, label: product.name })), [products]);
  const supplierOptions = useMemo<OptionRow[]>(() => suppliers.map((supplier) => ({ id: supplier.supplier_id, label: supplier.name })), [suppliers]);

  const openCreateDrawer = useCallback(() => {
    setSelectedBatch(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((batch: BatchRow) => {
    setSelectedBatch(batch);
    setForm({
      productId: batch.product_id,
      supplierId: batch.supplier_id,
      harvestDate: batch.harvest_date,
      expireDate: batch.expire_date,
      quantity: batch.quantity,
      qrCode: batch.qr_code ?? "",
      status: batch.status,
    });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedBatch(null);
    setForm(emptyForm());
  }, []);

  const patchForm = useCallback((patch: Partial<BatchFormValues>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const reloadData = useCallback(async () => {
    await Promise.all([loadBatches(), loadProducts(), loadSuppliers()]);
  }, [loadBatches, loadProducts, loadSuppliers]);

  const submitDrawer = useCallback(async () => {
    if (!form.productId.trim()) {
      setError("Sản phẩm là bắt buộc");
      return;
    }

    if (!form.supplierId.trim()) {
      setError("Nhà cung cấp là bắt buộc");
      return;
    }

    if (!form.harvestDate.trim()) {
      setError("Ngày thu hoạch là bắt buộc");
      return;
    }

    if (!form.expireDate.trim()) {
      setError("Ngày hết hạn là bắt buộc");
      return;
    }

    if (!Number.isInteger(form.quantity) || form.quantity < 0) {
      setError("Số lượng phải là số nguyên không âm");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(selectedBatch ? `/api/batches/${encodeURIComponent(selectedBatch.batch_id)}` : "/api/batches", {
        method: selectedBatch ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          supplierId: form.supplierId,
          harvestDate: form.harvestDate,
          expireDate: form.expireDate,
          quantity: form.quantity,
          qrCode: form.qrCode,
          status: selectedBatch ? form.status : undefined,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể lưu batch");
      }

      closeDrawer();
      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể lưu batch");
    } finally {
      setSaving(false);
    }
  }, [closeDrawer, form, reloadData, selectedBatch]);

  const deleteBatch = useCallback(async (batch: BatchRow) => {
    if (!window.confirm(`Xóa batch "${batch.batch_id}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/batches/${encodeURIComponent(batch.batch_id)}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể xóa batch");
      }

      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể xóa batch");
    } finally {
      setSaving(false);
    }
  }, [reloadData]);

  return (
    <AdminShell
      title="Quản lý lô hàng"
      description="Theo dõi lô nhập, hạn sử dụng, số lượng và truy xuất nguồn gốc từ Supabase."
      searchPlaceholder="Tìm kiếm batch, sản phẩm, nhà cung cấp..."
      pageActions={(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void reloadData()}
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
            Thêm batch
          </button>
        </div>
      )}
    >
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <BatchStats {...stats} />

      <BatchTable batches={batches} loading={loading} saving={saving} onEdit={openEditDrawer} onDelete={deleteBatch} />

      <BatchDrawer
        open={drawerOpen}
        saving={saving}
        batch={selectedBatch}
        form={form}
        products={productOptions}
        suppliers={supplierOptions}
        onChange={patchForm}
        onClose={closeDrawer}
        onSubmit={submitDrawer}
      />
    </AdminShell>
  );
};

export default BatchManagement;