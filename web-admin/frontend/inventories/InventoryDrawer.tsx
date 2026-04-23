"use client";

import React from "react";
import { ArrowLeftRight, ClipboardList, Hash, Trash2, X } from "lucide-react";
import type {
  InventoryRow,
  InventoryTransactionType,
} from "../../backend/modules/inventory/inventory-management.types";

export type InventoryFormValues = {
  quantityAvailable: string;
  quantityReserved: string;
  note: string;
  type: InventoryTransactionType;
};

export type InventoryDrawerMode = "edit" | "delete";

type InventoryDrawerProps = {
  isOpen: boolean;
  mode: InventoryDrawerMode;
  saving: boolean;
  error: string | null;
  selectedItem: InventoryRow | null;
  form: InventoryFormValues;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<InventoryFormValues>) => void;
};

const modeTitle: Record<InventoryDrawerMode, string> = {
  edit: "Cập nhật tồn kho",
  delete: "Xóa bản ghi tồn kho",
};

const InventoryDrawer = ({
  isOpen,
  mode,
  saving,
  error,
  selectedItem,
  form,
  onClose,
  onSubmit,
  onChange,
}: InventoryDrawerProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-label="Đóng"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-900">{modeTitle[mode]}</h2>
            <button
              type="button"
              onClick={onClose}
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

            <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Thông tin lô</p>
              <p><span className="font-semibold">Inventory ID:</span> {selectedItem?.inventory_id ?? "-"}</p>
              <p><span className="font-semibold">Batch ID:</span> {selectedItem?.batch_id ?? "-"}</p>
              <p><span className="font-semibold">Sản phẩm:</span> {selectedItem?.product_name ?? "Chưa gán sản phẩm"}</p>
              <p><span className="font-semibold">Supplier:</span> {selectedItem?.supplier_name ?? "-"}</p>
            </div>

            {mode === "delete" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                  Chỉ xóa khi cả tồn khả dụng và reserved đều bằng 0. Hành động này không thể hoàn tác.
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                  <p><span className="font-semibold">Khả dụng:</span> {selectedItem?.quantity_available ?? 0}</p>
                  <p><span className="font-semibold">Reserved:</span> {selectedItem?.quantity_reserved ?? 0}</p>
                </div>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmit();
                }}
              >
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">
                    Tồn khả dụng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={form.quantityAvailable}
                      onChange={(event) => onChange({ quantityAvailable: event.target.value })}
                      type="number"
                      min="0"
                      step="1"
                      className="w-full rounded-md border border-gray-300 px-10 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">
                    Số lượng reserved <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={form.quantityReserved}
                      onChange={(event) => onChange({ quantityReserved: event.target.value })}
                      type="number"
                      min="0"
                      step="1"
                      className="w-full rounded-md border border-gray-300 px-10 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Loại giao dịch</label>
                  <div className="relative">
                    <ArrowLeftRight className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.type}
                      onChange={(event) => onChange({ type: event.target.value as InventoryTransactionType })}
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-10 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    >
                      <option value="adjustment">Điều chỉnh (adjustment)</option>
                      <option value="stock_in">Nhập kho (stock_in)</option>
                      <option value="stock_out">Xuất kho (stock_out)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Ghi chú giao dịch</label>
                  <div className="relative">
                    <ClipboardList className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      value={form.note}
                      onChange={(event) => onChange({ note: event.target.value })}
                      rows={4}
                      placeholder="Mô tả lý do điều chỉnh tồn kho"
                      className="w-full resize-none rounded-md border border-gray-300 px-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-white p-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className={`rounded-md px-6 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                mode === "delete" ? "bg-rose-600 hover:bg-rose-700" : "bg-[#1da453] hover:bg-[#168a44]"
              }`}
              disabled={saving}
            >
              {saving ? "Đang xử lý..." : mode === "delete" ? "Xác nhận xóa" : "Cập nhật tồn kho"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default InventoryDrawer;