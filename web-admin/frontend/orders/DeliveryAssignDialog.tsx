"use client";

import React, { useEffect, useState } from "react";
import { Loader, Phone, X } from "lucide-react";
import type { DeliveryShipperOption } from "../../backend/modules/delivery-tracking/delivery-tracking.types";

type DeliveryAssignDialogProps = {
  isOpen: boolean;
  orderId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (employeeId: string, note: string) => void;
};

const DeliveryAssignDialog = ({
  isOpen,
  orderId,
  saving,
  onClose,
  onSubmit,
}: DeliveryAssignDialogProps) => {
  const [shippers, setShippers] = useState<DeliveryShipperOption[]>([]);
  const [loadingShippers, setLoadingShippers] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadShippers = async () => {
      setLoadingShippers(true);
      try {
        const response = await fetch("/api/deliveries/shippers", { cache: "no-store" });
        const data = (await response.json()) as { items?: DeliveryShipperOption[] };

        if (response.ok) {
          setShippers(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        setShippers([]);
      } finally {
        setLoadingShippers(false);
      }
    };

    void loadShippers();
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedEmployeeId.trim()) {
      alert("Vui lòng chọn shipper");
      return;
    }

    onSubmit(selectedEmployeeId, note);
    setSelectedEmployeeId("");
    setNote("");
  };

  const handleClose = () => {
    setSelectedEmployeeId("");
    setNote("");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/35 z-40 transition-opacity" onClick={handleClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-100 p-6 sticky top-0 bg-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phân công giao hàng</h2>
              <p className="mt-1 text-sm text-gray-500">Đơn hàng: {orderId}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Chọn shipper <span className="text-red-500">*</span>
              </label>

              {loadingShippers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : shippers.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Không có shipper nào khả dụng.
                </div>
              ) : (
                <div className="grid gap-2 max-h-96 overflow-y-auto">
                  {shippers.map((shipper) => (
                    <label
                      key={shipper.user_id}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        selectedEmployeeId === shipper.user_id
                          ? "border-[#059669] bg-emerald-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipper"
                        value={shipper.user_id}
                        checked={selectedEmployeeId === shipper.user_id}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-[#059669] focus:ring-[#059669]"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{shipper.name}</p>
                        {shipper.phone && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {shipper.phone}
                          </p>
                        )}
                        {shipper.role_name && (
                          <p className="text-xs text-gray-400 mt-1">{shipper.role_name}</p>
                        )}
                      </div>
                      {shipper.status && (
                        <span className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {shipper.status}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">Ghi chú giao hàng</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú khi giao hàng..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-white p-6 sticky bottom-0">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !selectedEmployeeId || loadingShippers}
              className="rounded-lg bg-[#059669] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#047857] disabled:opacity-60 inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Phân công giao hàng"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryAssignDialog;
