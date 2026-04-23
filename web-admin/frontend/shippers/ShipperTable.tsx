import React from "react";
import { CheckCircle2, Eye, Search, Truck, XCircle } from "lucide-react";
import type { DeliveryStatus, DeliveryTrackingRow } from "../../backend/modules/delivery-tracking/delivery-tracking.types";

type StatusFilter = "all" | DeliveryStatus;

type ShipperTableProps = {
  items: DeliveryTrackingRow[];
  loading: boolean;
  saving: boolean;
  searchQuery: string;
  statusFilter: StatusFilter;
  fromDate: string;
  toDate: string;
  counts: Record<StatusFilter, number>;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onOpenDetail: (orderId: string) => void;
};

const statusMeta: Record<DeliveryStatus, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "bg-gray-50 text-gray-600 border-gray-200" },
  assigned: { label: "Đã phân công", className: "bg-blue-50 text-blue-600 border-blue-200" },
  picked_up: { label: "Đã lấy hàng", className: "bg-amber-50 text-amber-600 border-amber-200" },
  delivering: { label: "Đang giao", className: "bg-purple-50 text-purple-600 border-purple-200" },
  delivered: { label: "Đã giao", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  failed: { label: "Thất bại", className: "bg-red-50 text-red-600 border-red-200" },
  cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

const formatCurrency = (value: number): string => {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} đ`;
};

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const ShipperTable = ({
  items,
  loading,
  saving,
  searchQuery,
  statusFilter,
  fromDate,
  toDate,
  counts,
  onSearchQueryChange,
  onStatusFilterChange,
  onFromDateChange,
  onToDateChange,
  onOpenDetail,
}: ShipperTableProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          <button type="button" onClick={() => onStatusFilterChange("all")} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "all" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}>
            Tất cả ({counts.all})
          </button>
          <button type="button" onClick={() => onStatusFilterChange("pending")} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "pending" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}>
            Chờ xử lý ({counts.pending})
          </button>
          <button type="button" onClick={() => onStatusFilterChange("assigned")} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "assigned" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}>
            Đã phân công ({counts.assigned})
          </button>
          <button type="button" onClick={() => onStatusFilterChange("delivering")} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "delivering" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}>
            Đang giao ({counts.delivering})
          </button>
          <button type="button" onClick={() => onStatusFilterChange("delivered")} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "delivered" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}>
            Đã giao ({counts.delivered})
          </button>
          <button type="button" onClick={() => onStatusFilterChange("failed")} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "failed" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}>
            Thất bại ({counts.failed})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            type="date"
            className="h-9 w-36 border border-gray-200 rounded-lg bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-gray-400">-</span>
          <input
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            type="date"
            className="h-9 w-36 border border-gray-200 rounded-lg bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="relative ml-2 w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              type="text"
              placeholder="Tìm mã đơn, khách, địa chỉ, ghi chú..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Mã đơn / Lần cập nhật</th>
              <th className="px-6 py-4 font-medium">Khách hàng</th>
              <th className="px-6 py-4 font-medium">Địa chỉ giao</th>
              <th className="px-6 py-4 font-medium text-center">Tổng tiền</th>
              <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>Đang tải dữ liệu giao hàng...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>Không tìm thấy đơn giao hàng phù hợp.</td>
              </tr>
            ) : (
              items.map((item) => {
                const meta = statusMeta[item.latest_status];

                return (
                  <tr key={item.order_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <p className="font-bold text-[#059669] mb-1">{item.order_id}</p>
                      <p className="text-[11px] text-gray-400">{formatDateTime(item.latest_tracking_at)}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="font-bold text-gray-900 mb-1">{item.customer_name ?? "Khách chưa xác định"}</p>
                      <p className="text-[11px] font-medium text-gray-500">{item.customer_phone ?? "-"}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-gray-800 leading-relaxed">{item.delivery_address}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{item.tracking_count} lần tracking</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">{formatCurrency(item.total_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-bold border ${meta.className}`}>
                        {meta.label}
                      </span>
                      {item.latest_note ? <p className="mt-1 text-[10px] text-gray-400">{item.latest_note}</p> : null}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(item.order_id)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-black disabled:opacity-60"
                      >
                        Xem / Cập nhật <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
        <span className="text-sm text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">{items.length === 0 ? 0 : 1} - {items.length}</span> trong tổng số <span className="font-bold text-gray-900">{items.length}</span> đơn giao hàng
        </span>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center border border-[#059669] bg-[#059669] text-white rounded-lg text-sm font-medium">1</button>
        </div>
      </div>
    </div>
  );
};

export default ShipperTable;