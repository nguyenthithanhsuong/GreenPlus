"use client";

import { AlertCircle, CheckCircle2, MessageSquare, RefreshCcw } from "lucide-react";

type ComplaintStatsProps = {
  pendingCount: number;
  resolvedCount: number;
  rejectedCount: number;
  refundOrReturnCount: number;
  feedbackCount: number;
};

const ComplaintStats = ({
  pendingCount,
  resolvedCount,
  rejectedCount,
  refundOrReturnCount,
  feedbackCount,
}: ComplaintStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <div className="rounded-full bg-white p-3 shadow-sm">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
          <h3 className="text-2xl font-bold text-gray-900">{pendingCount.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="rounded-full bg-orange-50 p-3">
          <RefreshCcw className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Hoàn tiền / Đổi trả</p>
          <h3 className="text-2xl font-bold text-gray-900">{refundOrReturnCount.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="rounded-full bg-blue-50 p-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Phản hồi / Góp ý</p>
          <h3 className="text-2xl font-bold text-gray-900">{feedbackCount.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="rounded-full bg-emerald-50 p-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đã giải quyết / Từ chối</p>
          <h3 className="text-2xl font-bold text-gray-900">
            {(resolvedCount + rejectedCount).toLocaleString("vi-VN")}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default ComplaintStats;