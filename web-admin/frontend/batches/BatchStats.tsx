import React from 'react';
import { Package, Clock, AlertCircle, Tag } from 'lucide-react';

const BatchStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Batches */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-full">
          <Package className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Lô hàng đang mở</p>
          <h3 className="text-2xl font-bold text-gray-900">45</h3>
        </div>
      </div>

      {/* Expiring Soon */}
      <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-orange-700">Cận date (&lt; 3 ngày)</p>
          <h3 className="text-2xl font-bold text-gray-900">4</h3>
        </div>
      </div>

      {/* Expired */}
      <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-700">Đã hết hạn (Expired)</p>
          <h3 className="text-2xl font-bold text-gray-900">2</h3>
        </div>
      </div>

      {/* Active Price Lists */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-full">
          <Tag className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Bảng giá đang áp dụng</p>
          <h3 className="text-2xl font-bold text-gray-900">128</h3>
        </div>
      </div>
    </div>
  );
};

export default BatchStats;