"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Check, CreditCard, MapPin, Package, Phone, X } from "lucide-react";
import type { OrderDetailRow, OrderStatus } from "../../backend/modules/orders/order-tracking.types";

type OrderDetailPanelProps = {
  isOpen: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  order: OrderDetailRow | null;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus, note: string) => void;
};

const statusOrder: OrderStatus[] = ["pending", "confirmed", "preparing", "delivering", "completed"];

const formatDateTime = (value: string | null): string => {
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

const formatCurrency = (value: number): string => {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} đ`;
};

const statusLabel = (status: OrderStatus): string => {
  const dictionary: Record<OrderStatus, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    delivering: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };

  return dictionary[status];
};

const OrderDetailPanel = ({ isOpen, loading, saving, error, order, onClose, onUpdateStatus }: OrderDetailPanelProps) => {
  const [nextStatus, setNextStatus] = useState<OrderStatus>("confirmed");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!order) {
      return;
    }

    const defaultNext: OrderStatus =
      order.status === "pending"
        ? "confirmed"
        : order.status === "confirmed"
          ? "preparing"
          : order.status === "preparing"
            ? "delivering"
            : order.status === "delivering"
              ? "completed"
              : order.status;

    setNextStatus(defaultNext);
    setNote("");
  }, [order]);

  const subtotal = useMemo(() => {
    return (order?.items ?? []).reduce((sum, item) => sum + item.line_total, 0);
  }, [order]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-gray-50 z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng: {order?.order_id ?? "-"}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(order?.order_date ?? null)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">
              Đang tải chi tiết đơn hàng...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : order ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#059669]" /> Thông tin nhận hàng
                  </h3>
                  <div className="space-y-3 text-sm flex-1">
                    <p className="font-bold text-gray-900 text-base">{order.customer_name ?? "Khách chưa xác định"}</p>
                    <p className="text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> {order.customer_phone ?? "-"}
                    </p>
                    <p className="text-gray-600 leading-relaxed">{order.delivery_address}</p>
                  </div>

                  {order.note ? (
                    <div className="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg">
                      <p className="text-xs font-bold text-yellow-700 mb-1">Ghi chú:</p>
                      <p className="text-sm text-gray-700 italic">{order.note}</p>
                    </div>
                  ) : null}
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#059669]" /> Tracking trạng thái
                  </h3>

                  <div className="relative pl-3 space-y-5 before:absolute before:inset-y-2 before:left-[15px] before:w-0.5 before:bg-gray-100">
                    {statusOrder.map((status, index) => {
                      const active = status === order.status;
                      const passed = statusOrder.indexOf(order.status) > index;

                      return (
                        <div key={status} className="relative pl-6">
                          <div className={`absolute left-[-5px] top-1 w-3 h-3 rounded-full ${active || passed ? "bg-[#059669] ring-4 ring-emerald-50" : "bg-gray-200"}`} />
                          <p className={`text-sm ${active ? "font-bold text-gray-900" : "font-medium text-gray-400"}`}>
                            {statusLabel(status)}
                          </p>
                        </div>
                      );
                    })}
                    <div className="relative pl-6">
                      <div className={`absolute left-[-5px] top-1 w-3 h-3 rounded-full ${order.status === "cancelled" ? "bg-red-500 ring-4 ring-red-50" : "bg-gray-200"}`} />
                      <p className={`text-sm ${order.status === "cancelled" ? "font-bold text-red-600" : "font-medium text-gray-400"}`}>
                        Đã hủy
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#059669]" /> Danh sách sản phẩm
                  </h3>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 font-medium">Sản phẩm</th>
                      <th className="px-5 py-3 font-medium text-center">SL</th>
                      <th className="px-5 py-3 font-medium text-right">Đơn giá</th>
                      <th className="px-5 py-3 font-medium text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.order_item_id} className="border-b border-gray-50">
                        <td className="px-5 py-3">
                          <div>
                            <p className="font-bold text-gray-900">{item.product_name ?? "Sản phẩm"}</p>
                            <p className="text-xs text-gray-500">Batch: {item.batch_id ?? "-"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-gray-900">{item.quantity}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-5 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-6 text-sm">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#059669]" /> Thanh toán
                    </h3>
                    <p className="text-gray-600">Phương thức: {order.payment_method ?? "-"}</p>
                    <p className="text-gray-600">Trạng thái: {order.payment_status ?? "pending"}</p>
                  </div>

                  <div className="space-y-1 min-w-[250px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tạm tính:</span>
                      <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phí giao hàng:</span>
                      <span className="text-gray-900">{formatCurrency(order.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                      <span className="font-bold text-gray-900">Tổng cộng:</span>
                      <span className="font-bold text-[#059669]">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="p-5 bg-white border-t border-gray-100 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <select
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={saving || !order}
            >
              <option value="confirmed">confirmed</option>
              <option value="preparing">preparing</option>
              <option value="delivering">delivering</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chú cập nhật trạng thái"
              className="h-10 w-64 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={saving || !order}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(nextStatus, note)}
              disabled={saving || !order || order.status === nextStatus}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Đang cập nhật..." : "Cập nhật trạng thái"} <Check className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPanel;