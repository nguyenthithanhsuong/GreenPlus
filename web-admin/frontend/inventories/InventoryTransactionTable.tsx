import React from "react";
import { Search } from "lucide-react";
import type {
  InventoryTransactionRow,
} from "../../backend/modules/inventory/inventory-management.types";

type InventoryTransactionTableProps = {
  items: InventoryTransactionRow[];
  loading: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

const formatDate = (value: string | null) => {
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

const getTypeClassName = (type: string) => {
  switch (type) {
    case "stock_in":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "stock_out":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-amber-50 text-amber-700 border-amber-100";
  }
};

const getQuantityDisplay = (
  type: string,
  quantity: number
) => {
  if (type === "stock_out") {
    return `- ${quantity}`;
  }

  if (type === "stock_in") {
    return `+ ${quantity}`;
  }

  return quantity;
};

const InventoryTransactionTable = ({
  items,
  loading,
  searchQuery,
  onSearchQueryChange,
}: InventoryTransactionTableProps) => {
  const totalItems = items.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center p-5 border-b border-gray-50 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Lịch sử giao dịch tồn kho
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Theo dõi toàn bộ thay đổi số lượng tồn kho
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 md:ml-auto w-full md:w-auto">
          <div className="relative w-full md:w-[28rem] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={searchQuery}
              onChange={(event) =>
                onSearchQueryChange(event.target.value)
              }
              type="text"
              placeholder="Tìm transaction ID, batch ID, ghi chú..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">
                Thời gian
              </th>

              <th className="px-6 py-4 font-medium">
                Transaction ID
              </th>

              <th className="px-6 py-4 font-medium">
                Batch ID
              </th>

              <th className="px-6 py-4 font-medium text-center">
                Loại
              </th>

              <th className="px-6 py-4 font-medium text-center">
                Số lượng
              </th>

              <th className="px-6 py-4 font-medium">
                Ghi chú
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
                  Đang tải lịch sử giao dịch...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-10 text-center text-gray-500"
                  colSpan={6}
                >
                  {searchQuery.trim()
                    ? "Không tìm thấy giao dịch phù hợp."
                    : "Chưa có lịch sử giao dịch."}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.transaction_id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Time */}
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Transaction ID */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {item.transaction_id}
                    </span>
                  </td>

                  {/* Batch ID */}
                  <td className="px-6 py-4 text-gray-600">
                    {item.batch_id ?? "-"}
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${getTypeClassName(
                        item.type
                      )}`}
                    >
                      {item.type.replace("_", " ")}
                    </span>
                  </td>

                  {/* Quantity */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`font-bold ${
                        item.type === "stock_out"
                          ? "text-red-600"
                          : item.type === "stock_in"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {getQuantityDisplay(
                        item.type,
                        item.quantity
                      )}
                    </span>
                  </td>

                  {/* Note */}
                  <td className="px-6 py-4 text-gray-600">
                    {item.note ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
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
          giao dịch
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

export default InventoryTransactionTable;