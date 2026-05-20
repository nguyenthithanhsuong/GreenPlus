"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import ConfirmActionDialog from "../users/ConfirmActionDialog";
import InventoryStats from "./InventoryStats";
import InventoryTable from "./InventoryTable";
import InventoryTransactionTable from "./InventoryTransactionTable";
import InventoryDrawer, { InventoryDrawerMode, InventoryFormValues } from "./InventoryDrawer";
import type {
  InventoryRow,
  InventoryTransactionRow,
} from "../../backend/modules/inventory/inventory-management.types";
import { inventorySearchStrategy } from "../shared/searchStrategies";

const emptyForm = (): InventoryFormValues => ({
  quantityAvailable: "0",
  quantityReserved: "0",
  note: "",
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | null>(null);
  const [viewMode, setViewMode] = useState<"inventory" | "transactions">(
  "inventory"
);

const [transactions, setTransactions] = useState<
  InventoryTransactionRow[]
>([]);

const [transactionsLoading, setTransactionsLoading] =
  useState(false);

const [transactionSearchQuery, setTransactionSearchQuery] =
  useState("");

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

  const loadTransactions = useCallback(async () => {
  setTransactionsLoading(true);

  try {
    const response = await fetch(
      "/api/inventory/transactions",
      {
        cache: "no-store",
      }
    );

    const data = (await response.json()) as {
      items?: InventoryTransactionRow[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        data.error ??
          "Không thể tải lịch sử giao dịch"
      );
    }

    setTransactions(
      Array.isArray(data.items)
        ? data.items
        : []
    );
  } catch (requestError) {
    setError(
      requestError instanceof Error
        ? requestError.message
        : "Không thể tải lịch sử giao dịch"
    );

    setTransactions([]);
  } finally {
    setTransactionsLoading(false);
  }
}, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadInventory(), loadTransactions()]);
  }, [loadInventory, loadTransactions]);

  useEffect(() => {
    void loadInventory();
    void loadTransactions();
  }, [loadInventory, loadTransactions]);

  const filteredItems = useMemo(
    () => inventorySearchStrategy.filter(items, searchQuery),
    [items, searchQuery]
  );

  const filteredTransactions = useMemo(() => {
  const query = transactionSearchQuery
    .trim()
    .toLowerCase();

  if (!query) {
    return transactions;
  }

  return transactions.filter((item) => {
    return (
      item.transaction_id
        .toLowerCase()
        .includes(query) ||
      (item.batch_id ?? "")
        .toLowerCase()
        .includes(query) ||
      (item.note ?? "")
        .toLowerCase()
        .includes(query) ||
      item.type.toLowerCase().includes(query)
    );
  });
}, [transactions, transactionSearchQuery]);

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
    });
    setDrawerError(null);
    setDrawerOpen(true);
  }, []);

  const openDeleteDrawer = useCallback((item: InventoryRow) => {
    setDeleteTarget(item);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, []);

  const confirmDeleteInventory = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/inventory/${encodeURIComponent(deleteTarget.inventory_id)}`,
        {
          method: "DELETE",
        }
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể xóa tồn kho");
      }

      closeDeleteDialog();
      await refreshAll();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Thao tác thất bại";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [closeDeleteDialog, deleteTarget, refreshAll]);

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
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể cập nhật tồn kho");
        }
      }

      closeDrawer();
      await refreshAll();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Thao tác thất bại";
      setDrawerError(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [closeDrawer, drawerMode, form, refreshAll, selectedItem]);

  return (
    <AdminShell
      title="Quản lý tồn kho"
      description="Cập nhật tồn kho theo lô, cảnh báo sắp hết hàng và điều phối nhập xuất."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || transactionsLoading || saving}
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
      <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => setViewMode("inventory")}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      viewMode === "inventory"
        ? "bg-emerald-600 text-white"
        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
    }`}
  >
    Tồn kho hiện tại
  </button>

  <button
    type="button"
    onClick={() => setViewMode("transactions")}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      viewMode === "transactions"
        ? "bg-emerald-600 text-white"
        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
    }`}
  >
    Lịch sử giao dịch
  </button>
</div>
      <InventoryStats {...stats} />
      {viewMode === "inventory" ? (
  <InventoryTable
    items={filteredItems}
    loading={loading}
    saving={saving}
    searchQuery={searchQuery}
    onSearchQueryChange={setSearchQuery}
    onUpdate={openEditDrawer}
    onDelete={openDeleteDrawer}
  />
) : (
  <InventoryTransactionTable
    items={filteredTransactions}
    loading={transactionsLoading}
    searchQuery={transactionSearchQuery}
    onSearchQueryChange={
      setTransactionSearchQuery
    }
  />
)}

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

      <ConfirmActionDialog
        open={deleteDialogOpen}
        title="Xóa tồn kho"
        message={
          deleteTarget
            ? `Bạn sắp xóa inventory ${deleteTarget.inventory_id}${deleteTarget.batch_id ? ` và toàn bộ lịch sử giao dịch của batch ${deleteTarget.batch_id}` : ""}. Hành động này không thể hoàn tác.`
            : "Bạn sắp xóa bản ghi tồn kho này. Hành động này không thể hoàn tác."
        }
        confirmLabel={saving ? "Đang xóa..." : "Xóa"}
        confirmVariant="danger"
        loading={saving}
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          void confirmDeleteInventory();
        }}
      />
    </AdminShell>
  );
};

export default InventoryManagement;