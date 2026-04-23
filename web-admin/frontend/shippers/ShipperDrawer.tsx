"use client";

import React from "react";
import { CalendarDays, CheckCircle2, ClipboardList, MapPin, Phone, Truck, X } from "lucide-react";
import type { DeliveryStatus, DeliveryTrackingDetailRow } from "../../backend/modules/delivery-tracking/delivery-tracking.types";

export type ShipperFormValues = {
  status: DeliveryStatus;
  note: string;
};

type ShipperDrawerProps = {
  isOpen: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  detail: DeliveryTrackingDetailRow | null;
  form: ShipperFormValues;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<ShipperFormValues>) => void;
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

const statusLabel: Record<DeliveryStatus, string> = {
  assigned: "Đã phân công",
  picked_up: "Đã lấy hàng",
  delivering: "Đang giao",
  delivered: "Đã giao",
};

const ShipperDrawer = ({ isOpen, loading, saving, error, detail, form, onClose, onSubmit, onChange }: ShipperDrawerProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/35" onClick={onClose} aria-label="Đóng" />

      <aside className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết giao hàng</h2>
              <p className="mt-1 text-sm text-gray-500">{detail?.order_id ?? "-"}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            {loading ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">Đang tải chi tiết giao hàng...</div>
            ) : detail ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Khách hàng</p>
                    <p className="mt-2 text-base font-bold text-gray-900">{detail.customer_name ?? "-"}</p>
                    <p className="mt-1 text-sm text-gray-600 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {detail.customer_phone ?? "-"}</p>
                    <p className="mt-1 text-sm text-gray-600 flex items-start gap-2"><MapPin className="h-4 w-4 text-gray-400 mt-0.5" /> {detail.delivery_address}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thông tin đơn</p>
                    <p className="mt-2 text-sm text-gray-700 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gray-400" /> Đặt lúc: {formatDateTime(detail.order_date)}</p>
                    <p className="mt-1 text-sm text-gray-700"><span className="font-semibold">Tổng tiền:</span> {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(detail.total_amount)} đ</p>
                    <p className="mt-1 text-sm text-gray-700"><span className="font-semibold">Trạng thái hiện tại:</span> {statusLabel[detail.status]}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nhân viên giao hàng</p>
                      <p className="mt-2 text-base font-bold text-gray-900">{detail.shipper_name ?? "Chưa phân công"}</p>
                      {detail.shipper_phone && (
                        <p className="mt-1 text-sm text-gray-600 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {detail.shipper_phone}</p>
                      )}
                    </div>
                    {detail.note && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700 max-w-sm">
                        <span className="font-semibold text-gray-900 block mb-1">Ghi chú gần nhất:</span>
                        {detail.note}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#059669]" /> Tiến độ giao hàng</h3>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex gap-3">
                      <div className="mt-1 h-3 w-3 rounded-full bg-[#059669] ring-4 ring-emerald-50" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-gray-900">Đã lấy hàng</p>
                          <p className="text-xs text-gray-400">{formatDateTime(detail.pickup_time)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className={`mt-1 h-3 w-3 rounded-full ring-4 ${detail.delivery_time ? 'bg-[#059669] ring-emerald-50' : 'bg-gray-300 ring-gray-50'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-gray-900">Đã giao hàng</p>
                          <p className="text-xs text-gray-400">{formatDateTime(detail.delivery_time)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#059669]" /> Cập nhật trạng thái</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Trạng thái mới</label>
                      <select
                        value={form.status}
                        onChange={(event) => onChange({ status: event.target.value as DeliveryStatus })}
                        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                        disabled={saving}
                      >
                        <option value="assigned">assigned</option>
                        <option value="picked_up">picked_up</option>
                        <option value="delivering">delivering</option>
                        <option value="delivered">delivered</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-gray-800">Ghi chú / lý do</label>
                      <textarea
                        value={form.note}
                        onChange={(event) => onChange({ note: event.target.value })}
                        rows={4}
                        className="w-full resize-none rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                        placeholder="Nhập ghi chú giao hàng"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-white p-6">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50" disabled={saving}>
              Hủy
            </button>
            <button type="button" onClick={onSubmit} className="rounded-md bg-[#1da453] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#168a44] disabled:opacity-60" disabled={saving || !detail}>
              {saving ? "Đang lưu..." : "Cập nhật trạng thái"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ShipperDrawer;