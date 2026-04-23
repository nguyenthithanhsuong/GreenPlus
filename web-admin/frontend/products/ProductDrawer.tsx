import React from "react";
import { X } from "lucide-react";
import type { CategoryRow, ProductRow, ProductStatus } from "../../backend/modules/catalog/product-management.types";

export type ProductFormValues = {
  categoryId: string;
  name: string;
  description: string;
  unit: string;
  imageUrl: string;
  nutrition: string;
  status: ProductStatus;
};

type ProductDrawerProps = {
  open: boolean;
  saving: boolean;
  product: ProductRow | null;
  form: ProductFormValues;
  categories: CategoryRow[];
  onChange: (patch: Partial<ProductFormValues>) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const statusLabel: Record<ProductStatus, string> = {
  active: "Đang bán",
  inactive: "Ngừng bán",
};

const ProductDrawer = ({ open, saving, product, form, categories, onChange, onClose, onSubmit }: ProductDrawerProps) => {
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
        className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col font-sans">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-900">{product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
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
              <div className="mb-4 flex flex-col items-center">
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="product" className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">Image</span>
                  )}
                </div>
                <span className="text-sm font-medium text-[#1da453]">Ảnh sản phẩm (URL)</span>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-800">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input
                  value={form.name}
                  onChange={(event) => onChange({ name: event.target.value })}
                  type="text"
                  placeholder="Ví dụ: Cà chua Cherry Thủy Canh"
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Danh mục</label>
                  <select
                    value={form.categoryId}
                    onChange={(event) => onChange({ categoryId: event.target.value })}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                  >
                    <option value="">Chưa phân loại</option>
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(event) => onChange({ status: event.target.value as ProductStatus })}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                  >
                    <option value="active">{statusLabel.active}</option>
                    <option value="inactive">{statusLabel.inactive}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Đơn vị tính <span className="text-red-500">*</span></label>
                  <input
                    value={form.unit}
                    onChange={(event) => onChange({ unit: event.target.value })}
                    type="text"
                    placeholder="Ví dụ: Hộp 500g"
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Ảnh đại diện (URL)</label>
                  <input
                    value={form.imageUrl}
                    onChange={(event) => onChange({ imageUrl: event.target.value })}
                    type="text"
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-800">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(event) => onChange({ description: event.target.value })}
                  placeholder="Mô tả ngắn về sản phẩm"
                  rows={4}
                  className="w-full resize-none rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-800">Nutrition</label>
                <textarea
                  value={form.nutrition}
                  onChange={(event) => onChange({ nutrition: event.target.value })}
                  placeholder="Thành phần, dinh dưỡng, lưu ý..."
                  rows={3}
                  className="w-full resize-none rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
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
                  {saving ? "Đang lưu..." : product ? "Cập nhật" : "Tạo sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ProductDrawer;