import React from "react";
import { ArrowLeftRight, Search, Trash2 } from "lucide-react";
import type { InventoryRow } from "../../backend/modules/inventory/inventory-management.types";

type InventoryTableProps = {
  items: InventoryRow[];
  loading: boolean;
  saving: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onUpdate: (item: InventoryRow) => void;
  onDelete: (item: InventoryRow) => void;
};

const formatLastUpdated = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const quantityClassName = (value: number) => {
  if (value === 0) {
    return "bg-gray-100 text-gray-500 border-gray-200";
  }

  if (value < 10) {
    return "bg-orange-50 text-orange-600 border-orange-100";
  }

  return "bg-emerald-50 text-emerald-600 border-emerald-100";
};

const InventoryTable = ({
  items,
  loading,
  saving,
  searchQuery,
  onSearchQueryChange,
  onUpdate,
  onDelete,
}: InventoryTableProps) => {
  const totalItems = items.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3 md:ml-auto w-full md:w-auto">
          <div className="relative w-full md:w-[28rem] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={searchQuery}
              onChange={(event) =>
                onSearchQueryChange(event.target.value)
              }
              type="text"
              placeholder="Tìm inventory ID hoặc batch ID..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">
                Inventory ID
              </th>

              <th className="px-6 py-4 font-medium">
                Batch ID
              </th>

              <th className="px-6 py-4 font-medium text-center">
                Tồn thực tế
                <br />
                <span className="font-normal">
                  (Available)
                </span>
              </th>

              <th className="px-6 py-4 font-medium text-center">
                Chờ giao
                <br />
                <span className="font-normal">
                  (Reserved)
                </span>
              </th>

              <th className="px-6 py-4 font-medium">
                Cập nhật lần cuối
              </th>

              <th className="px-6 py-4 font-medium text-right">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-6 py-10 text-center text-gray-500"
                  colSpan={6}
                >
                  Đang tải dữ liệu tồn kho...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-10 text-center text-gray-500"
                  colSpan={6}
                >
                  {searchQuery.trim()
                    ? "Không tìm thấy dữ liệu tồn kho phù hợp."
                    : "Chưa có dữ liệu tồn kho."}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.inventory_id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        {item.inventory_id}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {item.batch_id ?? "-"}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-4 py-1.5 rounded font-bold border ${quantityClassName(
                        item.quantity_available
                      )}`}
                    >
                      {item.quantity_available}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center font-bold text-gray-900">
                    {item.quantity_reserved ?? 0}
                  </td>

                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {formatLastUpdated(
                      item.last_updated
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdate(item)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        Cập nhật
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={
                          saving ||
                          item.quantity_available > 0 ||
                          (item.quantity_reserved ?? 0) > 0
                        }
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
        <span className="text-sm text-gray-500">
          Hiển thị{" "}
          <span className="font-bold text-gray-900">
            {totalItems === 0 ? 0 : 1} - {totalItems}
          </span>{" "}
          trong tổng số{" "}
          <span className="font-bold text-gray-900">
            {totalItems}
          </span>{" "}
          inventory
        </span>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center border border-[#059669] bg-[#059669] text-white rounded-lg text-sm font-medium">
            1
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;