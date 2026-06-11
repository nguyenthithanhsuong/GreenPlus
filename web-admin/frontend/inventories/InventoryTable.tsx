import React from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { usePermissions } from "@/lib/usePermissions";
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
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Reset về trang 1 khi search thay đổi
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Clamp page nếu totalPages thu hẹp lại
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

  const { hasPermission } = usePermissions();
  const canUpdateGlobal = hasPermission("inventory.update");
  const canDeleteGlobal = hasPermission("inventory.delete");
  const anyActions = canUpdateGlobal || canDeleteGlobal;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3 md:ml-auto w-full md:w-auto">
          <div className="relative w-full md:w-[28rem] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
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
              <th className="px-6 py-4 font-medium">Inventory ID</th>
              <th className="px-6 py-4 font-medium">Batch ID</th>
              <th className="px-6 py-4 font-medium">Sản phẩm</th>
              <th className="px-6 py-4 font-medium text-center">
                Tồn thực tế
                <br />
                <span className="font-normal">(Available)</span>
              </th>
              <th className="px-6 py-4 font-medium text-center">
                Chờ giao
                <br />
                <span className="font-normal">(Reserved)</span>
              </th>
              <th className="px-6 py-4 font-medium">Cập nhật lần cuối</th>
              {anyActions && (
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={7}>
                  Đang tải dữ liệu tồn kho...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={7}>
                  {searchQuery.trim()
                    ? "Không tìm thấy dữ liệu tồn kho phù hợp."
                    : "Chưa có dữ liệu tồn kho."}
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr
                  key={item.inventory_id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{item.inventory_id}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600 font-medium">{item.batch_id ?? "-"}</td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{item.product_name ?? "-"}</span>
                    </div>
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
                    {formatLastUpdated(item.last_updated)}
                  </td>

                  {anyActions ? (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdateGlobal && (
                          <button
                            type="button"
                            onClick={() => onUpdate(item)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            Cập nhật
                          </button>
                        )}

                        {canDeleteGlobal && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            disabled={saving}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  ) : null}
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
          tồn kho
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

export default InventoryTable;
