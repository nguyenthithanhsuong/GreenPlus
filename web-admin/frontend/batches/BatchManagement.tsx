"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Hash, Plus, RefreshCw, ScanSearch } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import { usePermissions } from "@/lib/usePermissions";
import { useCurrentUserProfile } from "../shared/useCurrentUserProfile";
import ConfirmActionDialog from "./ConfirmActionDialog";
import BatchDrawer, { BatchFormValues } from "./BatchDrawer";
import BatchScannerDialog from "./BatchScannerDialog";
import BatchStats from "./BatchStats";
import BatchTable from "./BatchTable";
import type { BatchRow } from "../../backend/modules/batches/batch-management.types";
import type { ProductRow } from "../../backend/modules/catalog/product-management.types";
import type { SupplierRow } from "../../backend/modules/suppliers/supplier-management.types";

type OptionRow = {
  id: string;
  label: string;
};

type ScannerMode = "batch" | "qr" | "camera";

const emptyForm = (): BatchFormValues => ({
  productId: "",
  supplierId: "",
  harvestDate: "",
  expireDate: "",
  quantity: 0,
  pricingMode: "unit",
  importPrice: "",
  importTotalPrice: "",
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

  if (batch.status === "rejected") {
    return "rejected";
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>("batch");
  const [scannerMenuOpen, setScannerMenuOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<
    | {
        type: "approve" | "reject" | "restore" | "delete";
        batch: BatchRow;
      }
    | null
  >(null);
  const { profile } = useCurrentUserProfile();
  const canForceManageApproved = (profile?.roleName ?? "").trim().toLowerCase() === "admin";
  const scannerMenuRef = useRef<HTMLDivElement | null>(null);

  const { hasPermission, loading: permLoading } = usePermissions();

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

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!scannerMenuOpen) {
        return;
      }

      if (scannerMenuRef.current && !scannerMenuRef.current.contains(event.target as Node)) {
        setScannerMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [scannerMenuOpen]);

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
  const supplierOptions = useMemo<OptionRow[]>(() => suppliers.map((supplier) => ({ id: supplier.supplier_id, label: supplier.name + (supplier.status === "rejected" ? " (Rejected)" : "") })), [suppliers]);

  const openCreateDrawer = useCallback(() => {
    setSelectedBatch(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }, []);

  const openScanner = useCallback((mode: ScannerMode) => {
    setScannerMode(mode);
    setScannerOpen(true);
    setScannerMenuOpen(false);
  }, []);

  const closeScanner = useCallback(() => {
    setScannerOpen(false);
  }, []);

  const openEditDrawer = useCallback((batch: BatchRow) => {
    setSelectedBatch(batch);
    setForm({
      productId: batch.product_id,
      supplierId: batch.supplier_id,
      harvestDate: batch.harvest_date,
      expireDate: batch.expire_date,
      quantity: batch.quantity,
      pricingMode: "unit",
      importPrice: batch.import_price === null ? "" : String(batch.import_price),
      importTotalPrice: batch.import_price === null ? "" : String(batch.import_price * batch.quantity),
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

  const requestApproveBatch = useCallback((batch: BatchRow) => {
    setConfirmState({ type: "approve", batch });
  }, []);

  const requestRejectBatch = useCallback((batch: BatchRow) => {
    setConfirmState({ type: "reject", batch });
  }, []);

  const requestRestoreBatch = useCallback((batch: BatchRow) => {
    setConfirmState({ type: "restore", batch });
  }, []);

  const requestDeleteBatch = useCallback((batch: BatchRow) => {
    setConfirmState({ type: "delete", batch });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmState(null);
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmState) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (confirmState.type === "approve") {
        const response = await fetch(`/api/batches/${encodeURIComponent(confirmState.batch.batch_id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "available" }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể duyệt batch");
        }
      } else if (confirmState.type === "reject") {
        const response = await fetch(`/api/batches/${encodeURIComponent(confirmState.batch.batch_id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể từ chối batch");
        }
      } else if (confirmState.type === "restore") {
        const response = await fetch(`/api/batches/${encodeURIComponent(confirmState.batch.batch_id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "pending" }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể đưa batch về chờ duyệt");
        }
      } else {
        const force = confirmState.batch.status === "available" && canForceManageApproved;
        const response = await fetch(`/api/batches/${encodeURIComponent(confirmState.batch.batch_id)}${force ? "?force=true" : ""}`, {
          method: "DELETE",
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? (force ? "Không thể force xóa batch" : "Không thể xóa batch"));
        }
      }

      closeConfirmDialog();
      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể xử lý batch");
    } finally {
      setSaving(false);
    }
  }, [canForceManageApproved, closeConfirmDialog, confirmState, reloadData]);

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

    const normalizedImportPrice = form.pricingMode === "unit" ? Number(form.importPrice) : Number(form.importTotalPrice) / form.quantity;
    const normalizedImportTotalPrice = form.pricingMode === "unit" ? Number(form.importPrice) * form.quantity : Number(form.importTotalPrice);

    if (form.pricingMode === "total" && form.quantity <= 0) {
      setError("Số lượng phải lớn hơn 0 khi nhập giá tổng thể");
      return;
    }

    if (!Number.isFinite(normalizedImportPrice) || normalizedImportPrice < 0) {
      setError("Giá nhập phải là số hợp lệ không âm");
      return;
    }

    if (!Number.isFinite(normalizedImportTotalPrice) || normalizedImportTotalPrice < 0) {
      setError("Giá tổng thể phải là số hợp lệ không âm");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const chosenSupplier = suppliers.find((s) => s.supplier_id === form.supplierId);
      let force = false;
      if (chosenSupplier && chosenSupplier.status === "rejected") {
        if (canForceManageApproved) {
          force = true;
        } else {
          throw new Error("Nhà cung cấp đã bị từ chối và không thể được gán bởi tài khoản của bạn");
        }
      }

      if (!force && selectedBatch && selectedBatch.status === "available" && canForceManageApproved) {
        force = true;
      }

      const response = await fetch(selectedBatch ? `/api/batches/${encodeURIComponent(selectedBatch.batch_id)}` : "/api/batches", {
        method: selectedBatch ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          supplierId: form.supplierId,
          harvestDate: form.harvestDate,
          expireDate: form.expireDate,
          quantity: form.quantity,
          importPrice: normalizedImportPrice,
          qrCode: form.qrCode,
          status: selectedBatch ? form.status : undefined,
          force,
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
  }, [canForceManageApproved, closeDrawer, form, reloadData, selectedBatch]);

  const deleteBatch = useCallback((batch: BatchRow) => {
    requestDeleteBatch(batch);
  }, [requestDeleteBatch]);

  return (
    <AdminShell
      title="Quản lý lô hàng"
      description="Theo dõi lô nhập, hạn sử dụng, số lượng và truy xuất nguồn gốc từ Supabase."
      searchPlaceholder="Tìm kiếm batch, sản phẩm, nhà cung cấp..."
      pageActions={(
        <div className="flex items-center gap-2">
            {permLoading ? (
                <>
                  <div ref={scannerMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setScannerMenuOpen((previous) => !previous)}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60"
                      disabled={loading || saving}
                    >
                      <ScanSearch className="h-4 w-4" />
                      Quét QR
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void reloadData()}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                    disabled={loading || saving}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tải lại
                  </button>
                </>
            ) : (
              <>
                <div ref={scannerMenuRef} className="relative">
                  {hasPermission('batches.qr_scan') ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setScannerMenuOpen((previous) => !previous)}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60"
                        disabled={loading || saving}
                      >
                        <ScanSearch className="h-4 w-4" />
                        Quét QR
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {scannerMenuOpen ? (
                        <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                          <button type="button" onClick={() => openScanner("batch")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <Hash className="h-4 w-4 text-gray-500" />
                            Nhập batch ID
                          </button>
                          <button type="button" onClick={() => openScanner("qr")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <ScanSearch className="h-4 w-4 text-emerald-600" />
                            Nhập QR
                          </button>
                          <button type="button" onClick={() => openScanner("camera")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <ScanSearch className="h-4 w-4 text-sky-600" />
                            Quét camera
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => void reloadData()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                  disabled={loading || saving}
                >
                  <RefreshCw className="h-4 w-4" />
                  Tải lại
                </button>

                {hasPermission('batches.create') ? (
                  <button
                    type="button"
                    onClick={openCreateDrawer}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#047857] disabled:opacity-60"
                    disabled={loading || saving}
                  >
                    <Plus className="h-4 w-4" />
                    Thêm batch
                  </button>
                ) : null}
              </>
            )}
        </div>
      )}
    >
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <BatchStats {...stats} />

      <BatchTable
        batches={batches}
        loading={loading}
        saving={saving}
        canForceManageApproved={canForceManageApproved}
        onApprove={requestApproveBatch}
        onReject={requestRejectBatch}
        onRestore={requestRestoreBatch}
        onEdit={openEditDrawer}
        onDelete={deleteBatch}
      />

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

      <ConfirmActionDialog
        open={Boolean(confirmState)}
        title={
          confirmState?.type === "approve"
            ? "Xác nhận duyệt batch"
            : confirmState?.type === "reject"
              ? "Xác nhận từ chối batch"
              : confirmState?.type === "restore"
                ? "Xác nhận quay lại chờ duyệt"
                : "Xác nhận xóa batch"
        }
        message={
          confirmState
            ? confirmState.type === "approve"
              ? `Bạn có chắc muốn duyệt batch ${confirmState.batch.batch_id}? Batch sẽ chuyển sang trạng thái khả dụng.`
              : confirmState.type === "reject"
                ? `Bạn có chắc muốn từ chối batch ${confirmState.batch.batch_id}? Batch sẽ chuyển sang trạng thái từ chối.`
                : confirmState.type === "restore"
                  ? `Bạn có chắc muốn đưa batch ${confirmState.batch.batch_id} quay lại chờ duyệt?`
                  : confirmState.batch.status === "available" && canForceManageApproved
                    ? `Bạn có chắc muốn force xóa batch ${confirmState.batch.batch_id}? Hành động này không thể hoàn tác.`
                    : `Bạn có chắc muốn xóa batch ${confirmState.batch.batch_id}? Hành động này không thể hoàn tác.`
            : ""
        }
        confirmLabel={
          confirmState?.type === "approve"
            ? "Duyệt batch"
            : confirmState?.type === "reject"
              ? "Từ chối batch"
              : confirmState?.type === "restore"
                ? "Quay lại chờ duyệt"
                : confirmState?.batch.status === "available" && canForceManageApproved
                  ? "Force xóa batch"
                  : "Xóa batch"
        }
        confirmVariant={confirmState?.type === "approve" || confirmState?.type === "restore" ? "warning" : "danger"}
        loading={saving}
        onCancel={closeConfirmDialog}
        onConfirm={() => {
          void handleConfirmAction();
        }}
      />

      <BatchScannerDialog open={scannerOpen} initialMode={scannerMode} onClose={closeScanner} />
    </AdminShell>
  );
};

export default BatchManagement;