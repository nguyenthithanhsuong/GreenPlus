import React from "react";
import { X } from "lucide-react";
import type { ComplaintRow } from "../../backend/modules/community/complaint-management.types";

type Props = {
  open: boolean;
  complaint: ComplaintRow | null;
  onClose: () => void;
};

export default function ComplaintDrawer({ open, complaint, onClose }: Props) {
  if (!open || !complaint) return null;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-black/35 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Đóng"
      />

      <aside className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl`}>
        <div className="flex h-full flex-col font-sans">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-900">Chi tiết khiếu nại</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Mã khiếu nại</p>
                <p className="text-sm font-medium text-gray-900">{complaint.complaint_id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Khách hàng</p>
                <p className="text-sm text-gray-900">{complaint.user_name ?? "Khách hàng ẩn danh"}</p>
                <p className="text-xs text-gray-500">{complaint.email ?? ""}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Mã đơn</p>
                <p className="text-sm text-gray-900">{complaint.order_id ?? "Không gắn đơn"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Loại</p>
                <p className="text-sm text-gray-900">{complaint.type}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Trạng thái</p>
                <p className="text-sm text-gray-900">{complaint.status}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Tạo lúc</p>
                <p className="text-sm text-gray-900">{complaint.created_at ? new Date(complaint.created_at).toLocaleString("vi-VN") : "N/A"}</p>
              </div>

              {complaint.resolved_at ? (
                <div>
                  <p className="text-xs text-gray-500">Giải quyết lúc</p>
                  <p className="text-sm text-gray-900">{new Date(complaint.resolved_at).toLocaleString("vi-VN")}</p>
                </div>
              ) : null}

              {complaint.reject_reason ? (
                <div>
                  <p className="text-xs text-gray-500">Lý do từ chối</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{complaint.reject_reason}</p>
                </div>
              ) : null}

              <div>
                <p className="text-xs text-gray-500">Nội dung</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{complaint.description}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
