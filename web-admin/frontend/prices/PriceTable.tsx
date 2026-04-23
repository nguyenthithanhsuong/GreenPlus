import React from "react";
import { Edit2, Package, Plus, Search, Trash2 } from "lucide-react";
import type { PriceRow } from "../../backend/modules/prices/price-management.types";

type PriceTableProps = {
  items: PriceRow[];
  loading: boolean;
  saving: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onCreate: () => void;
  onUpdate: (item: PriceRow) => void;
  onDelete: (item: PriceRow) => void;
};

const formatCurrency = (value: number): string => {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} đ`;
};

const formatDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
};

const isFutureDate = (value: string): boolean => {
  const target = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(target)) {
    return false;
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return target > todayUtc;
};

const PriceTable = ({
  items,
  loading,
  saving,
  searchQuery,
  onSearchQueryChange,
  onCreate,
  onUpdate,
  onDelete,
}: PriceTableProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-5 border-b border-gray-50 gap-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60"
        >
          <Plus className="w-4 h-4" /> Thiết lập Giá mới
        </button>
        <div className="relative w-full max-w-md md:ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            type="text"
            placeholder="Tìm theo batch, sản phẩm, supplier, giá..."
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium w-[30%]">Sản phẩm</th>
              <th className="px-6 py-4 font-medium">Phạm vi áp dụng (Batch)</th>
              <th className="px-6 py-4 font-medium text-center">Mức Giá (VNĐ)</th>
              <th className="px-6 py-4 font-medium text-center">Ngày bắt đầu áp dụng</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={5}>
                  Đang tải bảng giá...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={5}>
                  {searchQuery.trim() ? "Không tìm thấy mức giá phù hợp." : "Chưa có dữ liệu giá."}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const future = isFutureDate(item.date);
                return (
              <tr key={item.price_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                {/* Product Col */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0 flex items-center justify-center text-xs font-semibold text-gray-500">
                      SP
                    </div>
                    <span className="font-bold text-gray-900">
                      {item.product_name ?? "Chưa gán sản phẩm"}
                    </span>
                  </div>
                </td>
                
                {/* Scope Col */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${item.batch_id ? "text-orange-700 bg-orange-50 border-orange-100" : "text-blue-600 bg-blue-50 border-blue-100"}`}>
                    <Package className="w-3.5 h-3.5" /> {item.batch_id ? `Lô: ${item.batch_id}` : "Áp dụng chung"}
                  </span>
                </td>

                {/* Price Col */}
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-[15px] text-gray-900">{formatCurrency(item.price)}</span>
                  </div>
                </td>

                {/* Date Col */}
                <td className="px-6 py-4 text-center">
                  <p className="font-medium text-gray-700">
                    {formatDate(item.date)}
                  </p>
                  <p className={`text-[10px] font-bold mt-0.5 ${future ? "text-orange-600" : "text-emerald-600"}`}>
                    {future ? "Sắp áp dụng" : "Đang/đã áp dụng"}
                  </p>
                </td>

                {/* Actions Col */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdate(item)}
                      disabled={saving}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-60"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      disabled={saving || !future}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                      title={future ? "Xóa" : "Chỉ xóa được giá có hiệu lực trong tương lai"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
            })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PriceTable;