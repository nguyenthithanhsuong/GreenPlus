"use client";

import React from "react";
import { Check, Eye, Loader, Phone, Search, Truck } from "lucide-react";
import type { OrderListRow, OrderStatus } from "../../backend/modules/orders/order-tracking.types";

type StatusFilter = "all" | OrderStatus;

type OrderTableProps = {
  items: OrderListRow[];
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
  onQuickConfirm: (orderId: string) => void;
  onViewDelivery: (orderId: string) => void;
  onStartPreparing?: (orderId: string) => void;
  onStartDelivering?: (orderId: string) => void;
};

const statusMeta: Record<OrderStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-orange-500", text: "text-orange-600" },
  confirmed: { label: "Confirmed", dot: "bg-yellow-500", text: "text-yellow-600" },
  preparing: { label: "Preparing", dot: "bg-blue-500", text: "text-blue-600" },
  delivering: { label: "Delivering", dot: "bg-purple-500", text: "text-purple-600" },
  completed: { label: "Completed", dot: "bg-[#059669]", text: "text-[#059669]" },
  cancelled: { label: "Cancelled", dot: "bg-red-500", text: "text-red-500" },
};

const formatCurrency = (value: number): string => {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} đ`;
};

const formatOrderDate = (value: string | null): string => {
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

const paymentBadge = (method: OrderListRow["payment_method"], status: OrderListRow["payment_status"]) => {
  const methodText = method ? method.toUpperCase() : "N/A";
  const statusText = status ?? "pending";

  if (statusText === "paid") {
    return {
      text: `${methodText} (Đã TT)`,
      className: "bg-blue-50 text-blue-600 border-blue-200",
    };
  }

  if (statusText === "cancelled" || statusText === "failed") {
    return {
      text: `${methodText} (${statusText})`,
      className: "bg-gray-50 text-gray-500 border-gray-200",
    };
  }

  return {
    text: `${methodText} (Chưa TT)`,
    className: "bg-gray-50 text-gray-600 border-gray-200",
  };
};

const OrderTable = ({
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
  onQuickConfirm,
  onViewDelivery,
  onStartPreparing,
  onStartDelivering,
}: OrderTableProps) => {
  const totalItems = items.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "all" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}
          >
            Tất cả ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("pending")}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "pending" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}
          >
            Chờ xác nhận ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("confirmed")}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "confirmed" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}
          >
            Đã xác nhận ({counts.confirmed})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("preparing")}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "preparing" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}
          >
            Đang chuẩn bị ({counts.preparing})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("delivering")}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "delivering" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}
          >
            Đang giao ({counts.delivering})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("completed")}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "completed" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}
          >
            Hoàn thành ({counts.completed})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("cancelled")}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${statusFilter === "cancelled" ? "font-bold bg-white shadow-sm text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"}`}
          >
            Đã hủy ({counts.cancelled})
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
          <div className="relative ml-2 w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              type="text"
              placeholder="Tìm mã đơn, khách hàng..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Mã Đơn / Ngày đặt</th>
              <th className="px-6 py-4 font-medium">Khách hàng</th>
              <th className="px-6 py-4 font-medium text-center">Tổng tiền</th>
              <th className="px-6 py-4 font-medium text-center">Thanh toán</th>
              <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>
                  Đang tải dữ liệu đơn hàng...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>
                  Không có đơn hàng phù hợp điều kiện lọc.
                </td>
              </tr>
            ) : (
              items.map((order) => {
                const status = statusMeta[order.status];
                const payment = paymentBadge(order.payment_method, order.payment_status);

                return (
                  <tr key={order.order_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#059669] mb-0.5">{order.order_id}</p>
                      <p className="text-[11px] text-gray-400">{formatOrderDate(order.order_date)}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 mb-0.5">{order.customer_name ?? "Khách chưa xác định"}</p>
                      <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {order.customer_phone ?? "-"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold border ${payment.className}`}>
                        {payment.text}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className={`font-bold text-[11px] ${status.text}`}>{status.label}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {order.status === "confirmed" && onStartPreparing && (
                          <button
                            type="button"
                            onClick={() => onStartPreparing(order.order_id)}
                            disabled={saving}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                            title="Bắt đầu chuẩn bị"
                          >
                            <Loader className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === "preparing" && onStartDelivering && (
                          <button
                            type="button"
                            onClick={() => onStartDelivering(order.order_id)}
                            disabled={saving}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50"
                            title="Bắt đầu giao hàng"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {(order.status === "delivering" || order.status === "completed") && (
                          <button
                            type="button"
                            onClick={() => onViewDelivery(order.order_id)}
                            disabled={saving}
                            className="p-1.5 text-gray-500 hover:text-[#059669] hover:bg-emerald-50 rounded-full transition-colors disabled:opacity-50"
                            title="Xem giao hàng"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => onQuickConfirm(order.order_id)}
                            disabled={saving}
                            className="p-1.5 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-full transition-colors disabled:opacity-50"
                            title="Xác nhận"
                          >
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenDetail(order.order_id)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
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

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
        <span className="text-sm text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">{totalItems === 0 ? 0 : 1} - {totalItems}</span> trong tổng số <span className="font-bold text-gray-900">{totalItems}</span> đơn hàng
        </span>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center border border-[#059669] bg-[#059669] text-white rounded-lg text-sm font-medium">1</button>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;