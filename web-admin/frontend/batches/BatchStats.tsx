import React from "react";
import { AlertCircle, Clock, Package, ShieldAlert } from "lucide-react";

type BatchStatsProps = {
  totalBatches: number;
  availableBatches: number;
  expiringSoonBatches: number;
  problemBatches: number;
};

const BatchStats = ({ totalBatches, availableBatches, expiringSoonBatches, problemBatches }: BatchStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="rounded-full bg-gray-50 p-3">
          <Package className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng số batch</p>
          <h3 className="text-2xl font-bold text-gray-900">{totalBatches.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="rounded-full bg-white p-3 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-700">Đang khả dụng</p>
          <h3 className="text-2xl font-bold text-gray-900">{availableBatches.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
        <div className="rounded-full bg-white p-3 shadow-sm">
          <Clock className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-orange-700">Cận date (&lt; 3 ngày)</p>
          <h3 className="text-2xl font-bold text-gray-900">{expiringSoonBatches.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <div className="rounded-full bg-white p-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-700">Hết hạn / hết hàng</p>
          <h3 className="text-2xl font-bold text-gray-900">{problemBatches.toLocaleString("vi-VN")}</h3>
        </div>
      </div>
    </div>
  );
};

export default BatchStats;