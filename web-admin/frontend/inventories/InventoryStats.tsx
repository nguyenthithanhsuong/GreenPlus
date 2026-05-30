import React from "react";
import { AlertTriangle, Box, ShoppingBag, XCircle } from "lucide-react";

type InventoryStatsProps = {
  totalAvailable: number;
  lowStockCount: number;
  totalReserved: number;
  outOfStockCount: number;
};

const InventoryStats = ({ totalAvailable, lowStockCount, totalReserved, outOfStockCount }: InventoryStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Inventory */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-full">
          <Box className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng SL Tồn Kho</p>
          <h3 className="text-2xl font-bold text-gray-900">{totalAvailable.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      {/* Low Stock Warning */}
      <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-orange-700">Sắp hết hàng (&lt; 10)</p>
          <h3 className="text-2xl font-bold text-gray-900">{lowStockCount} <span className="text-base font-medium text-gray-600">lô</span></h3>
        </div>
      </div>

      {/* Reserved */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-full">
          <ShoppingBag className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đang chờ giao<br/>(Reserved)</p>
          <h3 className="text-2xl font-bold text-gray-900">{totalReserved.toLocaleString("vi-VN")}</h3>
        </div>
      </div>

      {/* Out of Stock */}
      <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-700">Hết hàng (Stock = 0)</p>
          <h3 className="text-2xl font-bold text-gray-900">{outOfStockCount} <span className="text-base font-medium text-gray-600">lô</span></h3>
        </div>
      </div>
    </div>
  );
};

export default InventoryStats;