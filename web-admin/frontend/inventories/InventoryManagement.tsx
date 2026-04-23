"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import InventoryStats from "./InventoryStats";
import InventoryTable from "./InventoryTable";
import InventoryDrawer, { InventoryDrawerMode, InventoryFormValues } from "./InventoryDrawer";
import type { InventoryRow } from "../../backend/modules/inventory/inventory-management.types";
import { inventorySearchStrategy } from "../shared/searchStrategies";

const emptyForm = (): InventoryFormValues => ({
  quantityAvailable: "0",
  quantityReserved: "0",
  note: "",
  type: "adjustment",
});

const InventoryManagement = () => {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<InventoryDrawerMode>("edit");
  const [selectedItem, setSelectedItem] = useState<InventoryRow | null>(null);
  const [form, setForm] = useState<InventoryFormValues>(emptyForm());
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/inventory", { cache: "no-store" });
      const data = (await response.json()) as { items?: InventoryRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải tồn kho");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải tồn kho");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const filteredItems = useMemo(
    () => inventorySearchStrategy.filter(items, searchQuery),
    [items, searchQuery]
  );

  const stats = useMemo(() => {
    const totalAvailable = items.reduce((sum, item) => sum + item.quantity_available, 0);
    const totalReserved = items.reduce((sum, item) => sum + item.quantity_reserved, 0);
    const lowStockCount = items.filter((item) => item.quantity_available > 0 && item.quantity_available < 10).length;
    const outOfStockCount = items.filter((item) => item.quantity_available === 0).length;

    return {
      totalAvailable,
      lowStockCount,
      totalReserved,
      outOfStockCount,
    };
  }, [items]);

  const openEditDrawer = useCallback((item: InventoryRow) => {
    setDrawerMode("edit");
    setSelectedItem(item);
    setForm({
      quantityAvailable: String(item.quantity_available),
      quantityReserved: String(item.quantity_reserved),
      note: "",
      type: "adjustment",
    });
    setDrawerError(null);
    setDrawerOpen(true);
  }, []);

  const openDeleteDrawer = useCallback((item: InventoryRow) => {
    setDrawerMode("delete");
    setSelectedItem(item);
    setForm({
      quantityAvailable: String(item.quantity_available),
      quantityReserved: String(item.quantity_reserved),
      note: "",
      type: "adjustment",
    });
    setDrawerError(null);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedItem(null);
    setForm(emptyForm());
    setDrawerError(null);
  }, []);

  const patchForm = useCallback((patch: Partial<InventoryFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const submitDrawer = useCallback(async () => {
    if (!selectedItem) {
      setDrawerError("Không tìm thấy bản ghi tồn kho cần thao tác");
      return;
    }

    if (drawerMode === "edit") {
      const nextAvailable = Number(form.quantityAvailable);
      const nextReserved = Number(form.quantityReserved);

      if (!Number.isInteger(nextAvailable) || nextAvailable < 0) {
        setDrawerError("Số lượng khả dụng phải là số nguyên không âm");
        return;
      }

      if (!Number.isInteger(nextReserved) || nextReserved < 0) {
        setDrawerError("Số lượng reserved phải là số nguyên không âm");
        return;
      }

      if (nextReserved > nextAvailable) {
        setDrawerError("Reserved không được lớn hơn khả dụng");
        return;
      }
    }

    setSaving(true);
    setError(null);
    setDrawerError(null);

    try {
      if (drawerMode === "edit") {
        const response = await fetch(`/api/inventory/${encodeURIComponent(selectedItem.inventory_id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantityAvailable: Number(form.quantityAvailable),
            quantityReserved: Number(form.quantityReserved),
            note: form.note.trim() || "Updated from inventory management",
            type: form.type,
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể cập nhật tồn kho");
        }
      }

      if (drawerMode === "delete") {
        const response = await fetch(`/api/inventory/${encodeURIComponent(selectedItem.inventory_id)}`, {
          method: "DELETE",
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể xóa tồn kho");
        }
      }

      closeDrawer();
      await loadInventory();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Thao tác thất bại";
      setDrawerError(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [closeDrawer, drawerMode, form, loadInventory, selectedItem]);

  return (
    <AdminShell
      title="Quản lý tồn kho"
      description="Cập nhật tồn kho theo lô, cảnh báo sắp hết hàng và điều phối nhập xuất."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadInventory()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <InventoryStats {...stats} />
      <InventoryTable
        items={filteredItems}
        loading={loading}
        saving={saving}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onUpdate={openEditDrawer}
        onDelete={openDeleteDrawer}
      />

      <InventoryDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        saving={saving}
        error={drawerError}
        selectedItem={selectedItem}
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

export default InventoryManagement;