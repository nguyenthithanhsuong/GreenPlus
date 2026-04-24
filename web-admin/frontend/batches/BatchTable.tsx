import React, { useDeferredValue } from "react";
import { ChevronLeft, ChevronRight, Copy, Edit2, Search, Trash2 } from "lucide-react";
import type { BatchRow, BatchStatus } from "../../backend/modules/batches/batch-management.types";
import { batchSearchStrategy } from "../shared/searchStrategies";

type BatchTab = "all" | BatchStatus | "expiring";

type BatchTableProps = {
  batches: BatchRow[];
  loading: boolean;
  saving: boolean;
  onEdit: (batch: BatchRow) => void;
  onDelete: (batch: BatchRow) => void;
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

const formatDate = (value: string): string => {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(parsed);
};

const daysUntilExpire = (expireDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expire = new Date(`${expireDate}T00:00:00`);
  expire.setHours(0, 0, 0, 0);

  return Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const deriveBatchStatus = (batch: BatchRow): BatchStatus => {
  if (batch.status === "pending") {
    return "pending";
  }

  if (batch.quantity <= 0) {
    return "sold_out";
  }

  if (daysUntilExpire(batch.expire_date) < 0) {
    return "expired";
  }

  return "available";
};

const getStatusLabel = (batch: BatchRow): string => {
  const effectiveStatus = deriveBatchStatus(batch);

  if (effectiveStatus === "pending") {
    return "Chờ duyệt";
  }

  if (effectiveStatus === "sold_out") {
    return "Hết hàng";
  }

  if (effectiveStatus === "expired") {
    return "Hết hạn";
  }

  const daysLeft = daysUntilExpire(batch.expire_date);
  if (daysLeft < 0) {
    return "Đã hết hạn";
  }

  if (daysLeft === 0) {
    return "Hết hạn hôm nay";
  }

  return `Còn ${daysLeft} ngày`;
};

const getStatusStyles = (batch: BatchRow): { badge: string; dot: string; text: string; label: string } => {
  const effectiveStatus = deriveBatchStatus(batch);

  if (effectiveStatus === "pending") {
    return {
      badge: "bg-amber-50",
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: "Chờ duyệt",
    };
  }

  if (effectiveStatus === "sold_out") {
    return {
      badge: "bg-gray-100",
      dot: "bg-gray-500",
      text: "text-gray-700",
      label: "Hết hàng",
    };
  }

  if (effectiveStatus === "expired") {
    return {
      badge: "bg-red-50",
      dot: "bg-red-500",
      text: "text-red-600",
      label: "Hết hạn",
    };
  }

  const daysLeft = daysUntilExpire(batch.expire_date);
  if (daysLeft >= 0 && daysLeft <= 3) {
    return {
      badge: "bg-orange-50",
      dot: "bg-orange-500",
      text: "text-orange-600",
      label: "Cận date",
    };
  }

  return {
    badge: "bg-emerald-50",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    label: "Khả dụng",
  };
};

const formatCode = (value: string): string => {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

const BatchTable = ({ batches, loading, saving, onEdit, onDelete }: BatchTableProps) => {
  const [activeTab, setActiveTab] = React.useState<BatchTab>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const tabCounts = React.useMemo(
    () => ({
      all: batches.length,
      pending: batches.filter((batch) => deriveBatchStatus(batch) === "pending").length,
      available: batches.filter((batch) => deriveBatchStatus(batch) === "available").length,
      expiring: batches.filter((batch) => {
        const status = deriveBatchStatus(batch);
        const daysLeft = daysUntilExpire(batch.expire_date);
        return status === "available" && daysLeft >= 0 && daysLeft <= 3;
      }).length,
      expired: batches.filter((batch) => deriveBatchStatus(batch) === "expired").length,
      sold_out: batches.filter((batch) => deriveBatchStatus(batch) === "sold_out").length,
    }),
    [batches]
  );

  const filteredBatches = React.useMemo(() => {
    const scopedBatches = batches.filter((batch) => {
      const effectiveStatus = deriveBatchStatus(batch);
      const daysLeft = daysUntilExpire(batch.expire_date);
      const isExpiringSoon = effectiveStatus === "available" && daysLeft >= 0 && daysLeft <= 3;

      return (
        activeTab === "all" ||
        (activeTab === "pending" && effectiveStatus === "pending") ||
        (activeTab === "available" && effectiveStatus === "available") ||
        (activeTab === "expiring" && isExpiringSoon) ||
        effectiveStatus === activeTab
      );
    });

    return batchSearchStrategy.filter(scopedBatches, deferredSearchQuery) as BatchRow[];
  }, [activeTab, batches, deferredSearchQuery]);

  const totalItems = filteredBatches.length;
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

  const visibleBatches = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBatches.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredBatches]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageItems = React.useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setSearchQuery(value);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-50 p-5 md:flex-row md:items-center">
        <div className="flex items-center space-x-1 overflow-x-auto rounded-lg bg-gray-50 p-1">
          <button type="button" onClick={() => setActiveTab("all")} className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${activeTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Tất cả ({tabCounts.all})
          </button>
          <button type="button" onClick={() => setActiveTab("available")} className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${activeTab === "available" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Khả dụng ({tabCounts.available})
          </button>
          <button type="button" onClick={() => setActiveTab("pending")} className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${activeTab === "pending" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Chờ duyệt ({tabCounts.pending})
          </button>
          <button type="button" onClick={() => setActiveTab("expiring")} className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${activeTab === "expiring" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Cận date ({tabCounts.expiring})
          </button>
          <button type="button" onClick={() => setActiveTab("expired")} className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${activeTab === "expired" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Hết hạn ({tabCounts.expired})
          </button>
          <button type="button" onClick={() => setActiveTab("sold_out")} className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${activeTab === "sold_out" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Hết hàng ({tabCounts.sold_out})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="text"
              placeholder="Tìm batch"
              className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-white text-xs text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Mã lô</th>
              <th className="px-6 py-4 font-medium">Sản phẩm / NCC</th>
              <th className="px-6 py-4 font-medium">Thu hoạch</th>
              <th className="px-6 py-4 font-medium">Hạn dùng</th>
              <th className="px-6 py-4 font-medium text-center">Số lượng</th>
              {/* <th className="px-6 py-4 font-medium">QR Code</th> */}
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Đang tải danh sách batch...</td>
              </tr>
            )}

            {!loading && filteredBatches.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Không có dữ liệu batch.</td>
              </tr>
            )}

            {!loading && visibleBatches.map((batch) => {
              const statusStyles = getStatusStyles(batch);

              return (
                <tr key={batch.batch_id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{formatCode(batch.batch_id)}</p>
                        <p className="text-[11px] text-gray-400">{batch.batch_id}</p>
                      </div>
                      <button type="button" onClick={() => void copyToClipboard(batch.batch_id)} className="text-gray-400 transition-colors hover:text-gray-600" title="Copy batch id" disabled={saving}>
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="mb-0.5 font-bold text-gray-900">{batch.product_name ?? "Chưa gán sản phẩm"}</p>
                    <p className="text-[11px] text-gray-500">NCC: {batch.supplier_name ?? "Chưa gán nhà cung cấp"}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(batch.harvest_date)}</td>
                  <td className="px-6 py-4">
                    <p className="mb-0.5 font-bold text-gray-800">{formatDate(batch.expire_date)}</p>
                    <p className={`text-[11px] ${deriveBatchStatus(batch) === "expired" ? "font-bold text-red-500" : deriveBatchStatus(batch) === "sold_out" ? "font-bold text-gray-500" : daysUntilExpire(batch.expire_date) <= 3 ? "font-bold text-orange-500" : "text-emerald-600"}`}>
                      {getStatusLabel(batch)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-900">{batch.quantity.toLocaleString("vi-VN")}</td>
                  {/* <td className="px-6 py-4">
                    {batch.qr_code ? (
                      <div className="flex items-center gap-2">
                        <span className="max-w-40 truncate rounded bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{batch.qr_code}</span>
                        <button type="button" onClick={() => void copyToClipboard(batch.qr_code ?? "")} className="text-gray-400 transition-colors hover:text-gray-600" title="Copy QR code" disabled={saving}>
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td> */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 rounded px-2.5 py-1 text-[11px] font-bold ${statusStyles.badge} ${statusStyles.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`} />
                      {statusStyles.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => onEdit(batch)} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60" title="Sửa" disabled={saving}>
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(batch)} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60" title="Xóa" disabled={saving}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
        <span className="text-sm text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">{startItem} - {endItem}</span> trong tổng số <span className="font-bold text-gray-900">{totalItems}</span>
        </span>

        <div className="flex items-center gap-1">
          <button type="button" className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50" onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))} disabled={currentPage === 1} aria-label="Trang trước">
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageItems.map((item, index) => {
            if (item === "ellipsis") {
              return <span key={`ellipsis-${index}`} className="px-1 text-gray-400">...</span>;
            }

            const isActive = item === currentPage;
            return (
              <button key={item} type="button" onClick={() => setCurrentPage(item)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${isActive ? "border border-emerald-500 bg-emerald-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`} aria-current={isActive ? "page" : undefined}>
                {item}
              </button>
            );
          })}

          <button type="button" className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50" onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))} disabled={currentPage === totalPages} aria-label="Trang sau">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchTable;