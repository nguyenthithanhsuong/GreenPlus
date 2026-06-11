"use client";

import React from "react";
import { ChevronLeft, ChevronRight, CreditCard, Eye, MessageSquare, Package, RefreshCcw, Search, XCircle, CircleCheck } from "lucide-react";
import { ComplaintRow, ComplaintStatus } from "../../backend/modules/complaints/complaint-management.types";

type ComplaintStatusFilter = "all" | ComplaintStatus;

type ComplaintTableProps = {
  complaints: ComplaintRow[];
  loading: boolean;
  savingComplaintId: string | null;
  activeStatus: ComplaintStatusFilter;
  searchValue: string;
  onStatusChange: (value: ComplaintStatusFilter) => void;
  onSearchChange: (value: string) => void;
  onViewComplaint: (complaint: ComplaintRow) => void;
  onResolve: (complaint: ComplaintRow) => void;
  onReject: (complaint: ComplaintRow) => void;
};

const statusTabs: Array<{ value: ComplaintStatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "resolved", label: "Đã giải quyết" },
  { value: "rejected", label: "Đã từ chối" },
];

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

const normalizeType = (type: string) => type.trim().toLowerCase();

const renderTypeBadge = (type: string) => {
  const normalized = normalizeType(type);
  if (normalized.includes("hoàn") || normalized.includes("refund")) {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600">
        <CreditCard className="h-3.5 w-3.5" /> Hoàn tiền
      </span>
    );
  }

  if (normalized.includes("đổi") || normalized.includes("trả") || normalized.includes("return")) {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-md border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-600">
        <RefreshCcw className="h-3.5 w-3.5" /> Đổi trả
      </span>
    );
  }

  return (
    <span className="flex w-fit items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600">
      <MessageSquare className="h-3.5 w-3.5" /> {type}
    </span>
  );
};

const statusUi = (status: ComplaintStatus) => {
  if (status === "resolved") {
    return { label: "Resolved", textClassName: "text-emerald-600", dotClassName: "bg-emerald-500" };
  }

  if (status === "rejected") {
    return { label: "Rejected", textClassName: "text-gray-500", dotClassName: "bg-gray-400" };
  }

  return { label: "Pending", textClassName: "text-red-500", dotClassName: "bg-red-500" };
};

const ComplaintTable = ({
  complaints,
  loading,
  savingComplaintId,
  activeStatus,
  searchValue,
  onStatusChange,
  onSearchChange,
  onViewComplaint,
  onResolve,
  onReject,
}: ComplaintTableProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalItems = complaints.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, activeStatus]);

  React.useEffect(() => {
    setCurrentPage((prev) => {
      if (prev > totalPages) return totalPages;
      if (prev < 1) return 1;
      return prev;
    });
  }, [totalPages]);

  const visibleItems = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return complaints.slice(start, start + PAGE_SIZE);
  }, [currentPage, complaints]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageItems = React.useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-50 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-1 overflow-x-auto rounded-lg bg-gray-50 p-1">
          {statusTabs.map((tab) => {
            const active = tab.value === activeStatus;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${
                  active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 md:w-[320px]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo khách hàng, mô tả, mã đơn..."
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Khách hàng / Mã đơn</th>
              <th className="px-6 py-4 font-medium">Loại khiếu nại</th>
              <th className="w-1/3 px-6 py-4 font-medium">Nội dung</th>
              <th className="px-6 py-4 font-medium">Thời gian</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 text-right font-medium">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-12 text-center text-sm text-gray-500" colSpan={6}>
                  Đang tải danh sách khiếu nại...
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center text-sm text-gray-500" colSpan={6}>
                  Không có khiếu nại phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => {
                const status = statusUi(item.status);
                const saving = savingComplaintId === item.complaint_id;

                return (
                  <tr key={item.complaint_id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.user_image_url ?? "https://i.pravatar.cc/150?img=36"}
                          alt={item.user_name ?? "Customer"}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                        <div>
                          <p className="mb-0.5 font-bold text-gray-900">{item.user_name ?? "Khách hàng ẩn danh"}</p>
                          <p className={`flex items-center gap-1 text-[11px] font-medium ${item.order_id ? "text-[#059669]" : "text-gray-500"}`}>
                            {item.order_id ? <Package className="h-3 w-3" /> : null}
                            {item.order_id ?? "Không gắn đơn hàng"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top pt-5">{renderTypeBadge(item.type)}</td>

                    <td className="px-6 py-4 align-top">
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed text-gray-700">{item.description}</p>
                      {item.reject_reason ? (
                        <p className="mt-2 flex items-start gap-1 text-[11px] font-medium text-red-500">
                          <XCircle className="mt-0.5 h-3.5 w-3.5" />
                          Lý do từ chối: {item.reject_reason}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 align-top pt-5">
                      <p className="text-xs text-gray-500">
                        {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "Không có thời gian"}
                      </p>
                    </td>

                    <td className="px-6 py-4 align-top pt-5">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
                        <span className={`text-[13px] font-semibold ${status.textClassName}`}>{status.label}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top pt-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => onViewComplaint(item)}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            Chi tiết
                          </span>
                        </button>

                        {item.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => onResolve(item)}
                              className="rounded-md bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span className="inline-flex items-center gap-1">
                                <CircleCheck className="h-3.5 w-3.5" />
                                Resolve
                              </span>
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => onReject(item)}
                              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 px-6 py-4">
        <span className="text-sm text-gray-500">
          Hiển thị{" "}
          <span className="font-bold text-gray-900">
            {startItem} - {endItem}
          </span>{" "}
          trong tổng số <span className="font-bold text-gray-900">{totalItems}</span>{" "}
          khiếu nại
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

export default ComplaintTable;