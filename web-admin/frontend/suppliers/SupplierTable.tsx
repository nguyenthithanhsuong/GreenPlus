import React, { useDeferredValue } from "react";
import { ChevronLeft, ChevronRight, Edit, Info, PencilLine, Search, X } from "lucide-react";
import type { SupplierRow, SupplierStatus } from "../../backend/modules/suppliers/supplier-management.types";
import { supplierSearchStrategy } from "../shared/searchStrategies";

type SupplierTableProps = {
  suppliers: SupplierRow[];
  loading: boolean;
  saving: boolean;
  onEdit: (supplier: SupplierRow) => void;
  onDelete: (supplier: SupplierRow) => void;
  onApprove: (supplier: SupplierRow) => void;
  onReject: (supplier: SupplierRow) => void;
};

type SupplierTab = "all" | SupplierStatus;

const PAGE_SIZE = 10;

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

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("vi-VN");
}

function getStatusStyles(status: SupplierStatus) {
  if (status === "approved") {
    return {
      dot: "bg-[#059669]",
      text: "text-[#047857]",
      label: "Đã duyệt",
    };
  }

  if (status === "rejected") {
    return {
      dot: "bg-red-500",
      text: "text-red-600",
      label: "Từ chối",
    };
  }

  return {
    dot: "bg-yellow-500",
    text: "text-yellow-600",
    label: "Chờ duyệt",
  };
}

const SupplierTable = ({ suppliers, loading, saving, onEdit, onDelete, onApprove, onReject }: SupplierTableProps) => {
  const [activeTab, setActiveTab] = React.useState<SupplierTab>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const statusCounts = React.useMemo(
    () => ({
      approved: suppliers.filter((supplier) => supplier.status === "approved").length,
      pending: suppliers.filter((supplier) => supplier.status === "pending").length,
      rejected: suppliers.filter((supplier) => supplier.status === "rejected").length,
    }),
    [suppliers]
  );

  const filteredSuppliers = React.useMemo(() => {
    const scopedSuppliers = suppliers.filter((supplier) => activeTab === "all" || supplier.status === activeTab);

    return supplierSearchStrategy.filter(scopedSuppliers, deferredSearchQuery);
  }, [activeTab, deferredSearchQuery, suppliers]);

  const totalItems = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, deferredSearchQuery]);

  React.useEffect(() => {
    setCurrentPage((previous) => {
      if (previous > totalPages) {
        return totalPages;
      }

      if (previous < 1) {
        return 1;
      }

      return previous;
    });
  }, [totalPages]);

  const visibleSuppliers = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSuppliers.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredSuppliers]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageItems = React.useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls: Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === "all" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === "approved" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Đang hoạt động
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center gap-1.5 ${activeTab === "pending" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Chờ duyệt
            <span className="flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">{statusCounts.pending}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === "rejected" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Đã từ chối/Khóa
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="text"
              placeholder="Tìm supplier"
              className="h-9 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Nhà cung cấp</th>
              <th className="px-6 py-4 font-medium">Địa chỉ</th>
              <th className="px-6 py-4 font-medium">Certificate</th>
              <th className="px-6 py-4 font-medium">Ngày tạo</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>
                  Đang tải danh sách supplier...
                </td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>
                  {searchQuery.trim() ? "Không tìm thấy supplier phù hợp." : "Chưa có supplier nào."}
                </td>
              </tr>
            ) : (
              visibleSuppliers.map((supplier) => {
                const statusStyles = getStatusStyles(supplier.status);

                return (
                  <tr key={supplier.supplier_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-gray-900">{supplier.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{supplier.description || "Chưa có mô tả"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{supplier.address}</td>
                    <td className="px-6 py-4">
                      {supplier.certificate ? (
                        <span className="inline-flex max-w-[14rem] rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700" title={supplier.certificate}>
                          {supplier.certificate}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Không có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(supplier.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusStyles.dot}`}></span>
                        <span className={`font-medium ${statusStyles.text}`}>
                          {statusStyles.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-3">
                        {supplier.status === "pending" && (
                          <>
                            <button
                              onClick={() => onApprove(supplier)}
                              className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md text-xs font-semibold transition-colors shadow-sm disabled:opacity-60"
                              disabled={saving}
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => onReject(supplier)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors border border-gray-200 disabled:opacity-60"
                              title="Từ chối"
                              disabled={saving}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {supplier.status === "approved" && (
                          <>
                            <button onClick={() => onEdit(supplier)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-60" title="Sửa" disabled={saving}>
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => onReject(supplier)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-60" title="Chuyển sang từ chối" disabled={saving}>
                              <PencilLine className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {supplier.status === "rejected" && (
                          <button onClick={() => onEdit(supplier)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-60" title="Xem / Sửa" disabled={saving}>
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => onDelete(supplier)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors border border-gray-200 disabled:opacity-60" title="Xóa" disabled={saving}>
                          <X className="w-3.5 h-3.5" />
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

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">{startItem} - {endItem}</span> trong tổng số <span className="font-bold text-gray-900">{totalItems}</span>
        </span>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage === 1}
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageItems.map((item, index) => {
            if (item === "ellipsis") {
              return <span key={`ellipsis-${index}`} className="px-1 text-gray-400">...</span>;
            }

            const isActive = item === currentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(item)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${isActive ? "border border-emerald-500 bg-emerald-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
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

export default SupplierTable;