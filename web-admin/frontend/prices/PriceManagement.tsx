"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import PriceStats from "./PriceStats";
import PriceTable from "./PriceTable";
import PriceDrawer, { PriceDrawerMode, PriceFormValues } from "./PriceDrawer";
import type { PriceRow } from "../../backend/modules/prices/price-management.types";
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
});

const PriceManagement = () => {
  const [items, setItems] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<PriceDrawerMode>("create");
  const [selectedPrice, setSelectedPrice] = useState<PriceRow | null>(null);
  const [form, setForm] = useState<PriceFormValues>(emptyForm());
  const [drawerError, setDrawerError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

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
        const response = await fetch(`/api/prices/${encodeURIComponent(selectedPrice.price_id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: form.batchId.trim() || null,
            price: Number(form.price),
            date: form.date.trim(),
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể cập nhật giá");
        }
      }

      if (drawerMode === "delete" && selectedPrice) {
        const response = await fetch(`/api/prices/${encodeURIComponent(selectedPrice.price_id)}`, {
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
  }, [closeDrawer, drawerMode, form, loadPrices, selectedPrice]);

  return (
    <AdminShell
      title="Quản lý giá"
      description="Theo dõi biến động giá, cập nhật giá khuyến mãi và giá theo lô hàng."
      pageActions={
        <button
          type="button"
          onClick={() => void loadPrices()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          disabled={loading || saving}
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
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
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onCreate={openCreateDrawer}
        onUpdate={openEditDrawer}
        onDelete={openDeleteDrawer}
      />

      <PriceDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        saving={saving}
        error={drawerError}
        selectedPrice={selectedPrice}
        form={form}
        onClose={closeDrawer}
        onSubmit={() => {
          void submitDrawer();
        }}
        onChange={patchForm}
      />
    </AdminShell>
  );
};

export default PriceManagement;