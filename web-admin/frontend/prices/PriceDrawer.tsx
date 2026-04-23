"use client";

import React from "react";
import { CalendarDays, Package, Tag, Trash2, X } from "lucide-react";
import type { PriceRow } from "../../backend/modules/prices/price-management.types";

export type PriceFormValues = {
  batchId: string;
  price: string;
  date: string;
};

export type PriceDrawerMode = "create" | "edit" | "delete";

type PriceDrawerProps = {
  isOpen: boolean;
  mode: PriceDrawerMode;
  saving: boolean;
  error: string | null;
  selectedPrice: PriceRow | null;
  form: PriceFormValues;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<PriceFormValues>) => void;
};

const formatCurrency = (value: number): string => {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} đ`;
};

const titleByMode: Record<PriceDrawerMode, string> = {
  create: "Thêm giá mới",
  edit: "Chỉnh sửa giá",
  delete: "Xóa mức giá",
};

const actionByMode: Record<PriceDrawerMode, string> = {
  create: "Tạo mức giá",
  edit: "Lưu thay đổi",
  delete: "Xác nhận xóa",
};

const PriceDrawer = ({
  isOpen,
  mode,
  saving,
  error,
  selectedPrice,
  form,
  onClose,
  onSubmit,
  onChange,
}: PriceDrawerProps) => {
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
            <h2 className="text-2xl font-bold text-gray-900">{titleByMode[mode]}</h2>
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

            {mode === "delete" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                  Hành động này sẽ xóa mức giá khỏi hệ thống. Chỉ nên xóa khi bản ghi là giá tương lai và không còn sử dụng.
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thông tin bản ghi</p>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold">Mã giá:</span> {selectedPrice?.price_id ?? "-"}</p>
                    <p><span className="font-semibold">Batch:</span> {selectedPrice?.batch_id ?? "Áp dụng chung"}</p>
                    <p><span className="font-semibold">Sản phẩm:</span> {selectedPrice?.product_name ?? "Chưa gán sản phẩm"}</p>
                    <p><span className="font-semibold">Giá:</span> {selectedPrice ? formatCurrency(selectedPrice.price) : "-"}</p>
                    <p><span className="font-semibold">Ngày áp dụng:</span> {selectedPrice?.date ?? "-"}</p>
                  </div>
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
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Mã batch (tùy chọn)</label>
                  <div className="relative">
                    <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={form.batchId}
                      onChange={(event) => onChange({ batchId: event.target.value })}
                      type="text"
                      placeholder="Nhập batch_id hoặc để trống"
                      className="w-full rounded-md border border-gray-300 px-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">
                    Giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={form.price}
                      onChange={(event) => onChange({ price: event.target.value })}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ví dụ: 65000"
                      className="w-full rounded-md border border-gray-300 px-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">
                    Ngày áp dụng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={form.date}
                      onChange={(event) => onChange({ date: event.target.value })}
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-10 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>

                {selectedPrice ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Thông tin hiện tại</p>
                    <p><span className="font-semibold">Mã giá:</span> {selectedPrice.price_id}</p>
                    <p><span className="font-semibold">Sản phẩm:</span> {selectedPrice.product_name ?? "Chưa gán sản phẩm"}</p>
                    <p><span className="font-semibold">Supplier:</span> {selectedPrice.supplier_name ?? "-"}</p>
                  </div>
                ) : null}
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
              {saving ? "Đang xử lý..." : mode === "delete" ? <span className="inline-flex items-center gap-2"><Trash2 className="h-4 w-4" /> {actionByMode[mode]}</span> : actionByMode[mode]}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PriceDrawer;