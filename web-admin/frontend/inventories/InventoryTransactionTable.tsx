import React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type {
  InventoryTransactionRow,
} from "../../backend/modules/inventory/inventory-management.types";

type InventoryTransactionTableProps = {
  items: InventoryTransactionRow[];
  loading: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

const PAGE_SIZE = 8;

const buildPageItems = (currentPage: number, totalPages: number): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
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
    case "adjust_in":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "stock_out":
    case "adjust_out":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-amber-50 text-amber-700 border-amber-100";
  }
};

const getQuantityDisplay = (type: string, quantity: number) => {
  if (type === "stock_out") return `- ${quantity}`;
  if (type === "stock_in") return `+ ${quantity}`;
  if (type === "adjust_out") return `- ${quantity}`;
  if (type === "adjust_in") return `+ ${quantity}`;
  return quantity;
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "stock_in":    return "Nhập kho";
    case "stock_out":   return "Xuất kho";
    case "adjust_in":   return "Điều chỉnh tăng";
    case "adjust_out":  return "Điều chỉnh giảm";
    default:            return "Điều chỉnh";
  }
};

const InventoryTransactionTable = ({
  items,
  loading,
  searchQuery,
  onSearchQueryChange,
}: InventoryTransactionTableProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  React.useEffect(() => {
    setCurrentPage((prev) => {
      if (prev > totalPages) return totalPages;
      if (prev < 1) return 1;
      return prev;
    });
  }, [totalPages]);

  const visibleItems = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [currentPage, items]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageItems = React.useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center p-5 border-b border-gray-50 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Lịch sử giao dịch tồn kho
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Theo dõi toàn bộ thay đổi số lượng tồn kho
          </p>
        </div>

        <div className="flex items-center gap-3 md:ml-auto w-full md:w-auto">
          <div className="relative w-full md:w-[28rem] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              type="text"
              placeholder="Tìm transaction ID, batch ID, ghi chú..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Thời gian</th>
              <th className="px-6 py-4 font-medium">Transaction ID</th>
              <th className="px-6 py-4 font-medium">Batch ID</th>
              <th className="px-6 py-4 font-medium text-center">Loại</th>
              <th className="px-6 py-4 font-medium text-center">Số lượng</th>
              <th className="px-6 py-4 font-medium">Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>
                  Đang tải lịch sử giao dịch...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>
                  {searchQuery.trim()
                    ? "Không tìm thấy giao dịch phù hợp."
                    : "Chưa có lịch sử giao dịch."}
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr
                  key={item.transaction_id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {item.transaction_id}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.batch_id ?? "-"}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${getTypeClassName(item.type)}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`font-bold ${
                        item.type === "stock_out" || item.type === "adjust_out"
                          ? "text-red-600"
                          : item.type === "stock_in" || item.type === "adjust_in"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {getQuantityDisplay(item.type, item.quantity)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.note ?? "-"}
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
          <span className="font-bold text-gray-900">{startItem} - {endItem}</span>{" "}
          trong tổng số{" "}
          <span className="font-bold text-gray-900">{totalItems}</span>{" "}
          giao dịch
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageItems.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-gray-400">
                  ...
                </span>
              );
            }

            const isActive = item === currentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(item)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                  isActive
                    ? "border border-emerald-500 bg-emerald-500 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryTransactionTable;
