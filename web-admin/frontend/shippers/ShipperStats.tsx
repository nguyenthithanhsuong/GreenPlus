import React from "react";
import { CheckCircle2, Clock3, Route, Truck } from "lucide-react";

type ShipperStatsProps = {
  totalDeliveries: number;
  inProgressCount: number;
  deliveredCount: number;
  failedCount: number;
};

const ShipperStats = ({ totalDeliveries, inProgressCount, deliveredCount, failedCount }: ShipperStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-full">
          <Truck className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng đơn giao</p>
          <h3 className="text-2xl font-bold text-gray-900">{totalDeliveries}</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-full">
          <Route className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-700">Đang xử lý</p>
          <h3 className="text-2xl font-bold text-gray-900">{inProgressCount}</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-full">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-700">Đã giao</p>
          <h3 className="text-2xl font-bold text-gray-900">{deliveredCount}</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-50 rounded-full">
          <Clock3 className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-700">Giao thất bại</p>
          <h3 className="text-2xl font-bold text-gray-900">{failedCount}</h3>
        </div>
      </div>
    </div>
  );
};

export default ShipperStats;