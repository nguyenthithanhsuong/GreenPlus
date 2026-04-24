import React from "react";
import { X } from "lucide-react";
import type { BatchRow, BatchStatus } from "../../backend/modules/batches/batch-management.types";

export type BatchFormValues = {
  productId: string;
  supplierId: string;
  harvestDate: string;
  expireDate: string;
  quantity: number;
  qrCode: string;
  status: BatchStatus;
};

type OptionRow = {
  id: string;
  label: string;
};

type BatchDrawerProps = {
  open: boolean;
  saving: boolean;
  batch: BatchRow | null;
  form: BatchFormValues;
  products: OptionRow[];
  suppliers: OptionRow[];
  onChange: (patch: Partial<BatchFormValues>) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const statusLabel: Record<BatchStatus, string> = {
  pending: "Chờ duyệt",
  available: "Khả dụng",
  expired: "Hết hạn",
  sold_out: "Hết hàng",
};

const BatchDrawer = ({ open, saving, batch, form, products, suppliers, onChange, onClose, onSubmit }: BatchDrawerProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-black/35 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Đóng"
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col font-sans">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-900">{batch ? "Chỉnh sửa batch" : "Thêm batch mới"}</h2>
            <button type="button" onClick={onClose} className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Sản phẩm <span className="text-red-500">*</span></label>
                  <select value={form.productId} onChange={(event) => onChange({ productId: event.target.value })} className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]">
                    <option value="">Chọn sản phẩm</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Nhà cung cấp <span className="text-red-500">*</span></label>
                  <select value={form.supplierId} onChange={(event) => onChange({ supplierId: event.target.value })} className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]">
                    <option value="">Chọn nhà cung cấp</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Ngày thu hoạch <span className="text-red-500">*</span></label>
                  <input value={form.harvestDate} onChange={(event) => onChange({ harvestDate: event.target.value })} type="date" className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Ngày hết hạn <span className="text-red-500">*</span></label>
                  <input value={form.expireDate} onChange={(event) => onChange({ expireDate: event.target.value })} type="date" className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Số lượng khởi tạo <span className="text-red-500">*</span></label>
                  <input value={form.quantity} onChange={(event) => onChange({ quantity: Number(event.target.value) })} type="number" min={0} step={1} placeholder="0" className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Trạng thái</label>
                  <select value={form.status} onChange={(event) => onChange({ status: event.target.value as BatchStatus })} disabled={!batch} className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500">
                    <option value="pending">{statusLabel.pending}</option>
                    <option value="available">{statusLabel.available}</option>
                    <option value="expired">{statusLabel.expired}</option>
                    <option value="sold_out">{statusLabel.sold_out}</option>
                  </select>
                  {!batch ? <p className="mt-1 text-xs text-gray-500">Batch mới luôn khởi tạo ở trạng thái chờ duyệt.</p> : null}
                </div>
              </div>

              {/* <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-800">QR Code</label>
                <input value={form.qrCode} onChange={(event) => onChange({ qrCode: event.target.value })} type="text" placeholder="Mã QR hoặc đường dẫn in tem" className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]" />
              </div> */}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="rounded-md bg-[#1da453] px-4 py-2 text-sm font-semibold text-white hover:bg-[#178546] disabled:opacity-60">
                  {saving ? "Đang lưu..." : batch ? "Cập nhật" : "Tạo batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default BatchDrawer;