"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Plus } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import { usePermissions } from "@/lib/usePermissions";
import ConfirmActionDialog from "../users/ConfirmActionDialog";
import PriceStats from "./PriceStats";
import PriceTable from "./PriceTable";
import PriceDrawer, { BatchOption, PriceDrawerMode, PriceFormValues } from "./PriceDrawer";
import type { PriceRow } from "../../backend/modules/prices/price-management.types";
import type { BatchRow } from "../../backend/modules/batches/batch-management.types";
import { useCurrentUserProfile } from "../shared/useCurrentUserProfile";
import { priceSearchStrategy } from "../shared/searchStrategies";

const todayIso = () => {
  const now = new Date();
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${now.getUTCDate()}`.padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}-${day}`;
};

const emptyForm = (): PriceFormValues => ({
  batchId: "",
  price: "",
  date: todayIso(),
  status: "",
});

const PriceManagement = () => {
  const { profile } = useCurrentUserProfile();
  const [items, setItems] = useState<PriceRow[]>([]);
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<PriceDrawerMode>("create");
  const [selectedPrice, setSelectedPrice] = useState<PriceRow | null>(null);
  const [form, setForm] = useState<PriceFormValues>(emptyForm());
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationTarget, setModerationTarget] = useState<PriceRow | null>(null);
  const [moderationNextStatus, setModerationNextStatus] = useState<"active" | "inactive" | null>(null);

  const canForceManagePrice = (profile?.roleName ?? "").trim().toLowerCase() === "admin";

  const { hasPermission, loading: permLoading } = usePermissions();

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prices", { cache: "no-store" });
      const data = (await response.json()) as { items?: PriceRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải bảng giá");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải bảng giá");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const response = await fetch("/api/batches", { cache: "no-store" });
      const data = (await response.json()) as { items?: BatchRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách batch");
      }

      const nextBatchOptions = Array.isArray(data.items)
        ? data.items.map((batch) => ({
            batchId: batch.batch_id,
            productName: batch.product_name,
            importPrice: batch.import_price,
          }))
        : [];

      setBatchOptions(nextBatchOptions);
    } catch {
      setBatchOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadPrices();
    void loadBatches();
  }, [loadBatches, loadPrices]);

  const filteredItems = useMemo(
    () => priceSearchStrategy.filter(items, searchQuery),
    [items, searchQuery]
  );

  const stats = useMemo(() => {
    const today = todayIso();
    return {
      totalPrices: items.length,
      batchScopedPrices: items.filter((item) => Boolean(item.batch_id)).length,
      todayEffectivePrices: items.filter((item) => item.date === today).length,
      futurePrices: items.filter((item) => item.date > today).length,
    };
  }, [items]);

  const openCreateDrawer = useCallback(() => {
    setDrawerMode("create");
    setSelectedPrice(null);
    setForm(emptyForm());
    setDrawerError(null);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((item: PriceRow) => {
    setDrawerMode("edit");
    setSelectedPrice(item);
    setForm({
      batchId: item.batch_id ?? "",
      price: String(item.price),
      date: item.date,
      status: item.status ?? "",
    });
    setDrawerError(null);
    setDrawerOpen(true);
  }, []);

  const openDeleteDrawer = useCallback((item: PriceRow) => {
    setDrawerMode("delete");
    setSelectedPrice(item);
    setForm({
      batchId: item.batch_id ?? "",
      price: String(item.price),
      date: item.date,
      status: item.status ?? "",
    });
    setDrawerError(null);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedPrice(null);
    setForm(emptyForm());
    setDrawerError(null);
  }, []);

  const closeModerationDialog = useCallback(() => {
    setModerationDialogOpen(false);
    setModerationTarget(null);
    setModerationNextStatus(null);
  }, []);

  const openModerationDialog = useCallback((item: PriceRow, nextStatus: "active" | "inactive") => {
    setModerationTarget(item);
    setModerationNextStatus(nextStatus);
    setModerationDialogOpen(true);
  }, []);

  const submitModeration = useCallback(async () => {
    if (!moderationTarget || !moderationNextStatus) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/prices/${encodeURIComponent(moderationTarget.price_id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: moderationNextStatus }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể cập nhật trạng thái giá");
      }

      closeModerationDialog();
      await loadPrices();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Thao tác thất bại";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [closeModerationDialog, loadPrices, moderationNextStatus, moderationTarget]);

  const patchForm = useCallback((patch: Partial<PriceFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const submitDrawer = useCallback(async () => {
    if (drawerMode !== "delete") {
      const normalizedPrice = Number(form.price);
      if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
        setDrawerError("Giá phải là số hợp lệ lớn hơn hoặc bằng 0");
        return;
      }

      if (!form.date.trim()) {
        setDrawerError("Ngày áp dụng là bắt buộc");
        return;
      }
    }

    if ((drawerMode === "edit" || drawerMode === "delete") && !selectedPrice) {
      setDrawerError("Không tìm thấy bản ghi giá cần thao tác");
      return;
    }

    setSaving(true);
    setError(null);
    setDrawerError(null);

    try {
      if (drawerMode === "create") {
        const response = await fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: form.batchId.trim() || null,
            price: Number(form.price),
            date: form.date.trim(),
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể tạo giá");
        }
      }

      if (drawerMode === "edit" && selectedPrice) {
        const force = canForceManagePrice && selectedPrice.status === "active";
        const editUrl = `/api/prices/${encodeURIComponent(selectedPrice.price_id)}${force ? "?force=true" : ""}`;
        const response = await fetch(editUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: form.batchId.trim() || null,
            price: Number(form.price),
            date: form.date.trim(),
            status: form.status || null,
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể cập nhật giá");
        }
      }

      if (drawerMode === "delete" && selectedPrice) {
        const force = canForceManagePrice && selectedPrice.status === "active";
        const response = await fetch(`/api/prices/${encodeURIComponent(selectedPrice.price_id)}${force ? "?force=true" : ""}`, {
          method: "DELETE",
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể xóa giá");
        }
      }

      closeDrawer();
      await loadPrices();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Thao tác thất bại";
      setDrawerError(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [canForceManagePrice, closeDrawer, drawerMode, form, loadPrices, selectedPrice]);

  return (
    <AdminShell
      title="Quản lý giá"
      description="Theo dõi biến động giá, cập nhật giá khuyến mãi và giá theo lô hàng."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadPrices()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
          {!permLoading && hasPermission('prices.create') && (
            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#047857] disabled:opacity-60"
              disabled={loading || saving}
            >
              <Plus className="h-4 w-4" />
              Thiết lập Giá mới
            </button>
          )}
        </div>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <PriceStats {...stats} />
      <PriceTable
        items={filteredItems}
        loading={loading}
        saving={saving}
        canForceManagePrice={canForceManagePrice}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onCreate={openCreateDrawer}
        onUpdate={(item) => openEditDrawer(item)}
        onDelete={(item) => openDeleteDrawer(item)}
        onQuickApprove={(item) => openModerationDialog(item, "active")}
        onQuickReject={(item) => openModerationDialog(item, "inactive")}
      />

      <PriceDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        saving={saving}
        error={drawerError}
        selectedPrice={selectedPrice}
        form={form}
        batchOptions={batchOptions}
        onClose={closeDrawer}
        onSubmit={() => {
          void submitDrawer();
        }}
        onChange={patchForm}
      />

      <ConfirmActionDialog
        open={moderationDialogOpen}
        title={moderationNextStatus === "active" ? "Duyệt giá" : "Từ chối giá"}
        message={
          moderationTarget
            ? `Bạn sắp ${moderationNextStatus === "active" ? "duyệt" : "từ chối"} mức giá ${moderationTarget.price_id}${moderationTarget.product_name ? ` của ${moderationTarget.product_name}` : ""}. Hành động này sẽ đổi trạng thái ngay lập tức.`
            : "Bạn sắp thay đổi trạng thái giá. Hành động này sẽ đổi ngay lập tức."
        }
        confirmLabel={moderationNextStatus === "active" ? "Duyệt" : "Từ chối"}
        confirmVariant={moderationNextStatus === "active" ? "warning" : "danger"}
        loading={saving}
        onCancel={closeModerationDialog}
        onConfirm={() => {
          void submitModeration();
        }}
      />
    </AdminShell>
  );
};

export default PriceManagement;
