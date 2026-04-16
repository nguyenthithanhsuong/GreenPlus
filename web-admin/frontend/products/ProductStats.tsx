import React from 'react';
import { Package, CheckCircle2, Ban } from 'lucide-react';

const ProductStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Products */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-gray-50 rounded-full">
          <Package className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng số Sản phẩm gốc</p>
          <h3 className="text-2xl font-bold text-gray-900">324</h3>
        </div>
      </div>

      {/* Active Products */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-emerald-50 rounded-full">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Trạng thái (Active)</p>
          <h3 className="text-2xl font-bold text-gray-900">310</h3>
        </div>
      </div>

      {/* Inactive Products */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-gray-50 rounded-full">
          <Ban className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Ngừng kinh doanh (Inactive)</p>
          <h3 className="text-2xl font-bold text-gray-900">14</h3>
        </div>
      </div>
    </div>
  );
};

export default ProductStats;