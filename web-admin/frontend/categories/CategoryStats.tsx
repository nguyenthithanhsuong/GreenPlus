import React from 'react';
import { Layers, Package, Award } from 'lucide-react';

const CategoryStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Categories */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-gray-50 rounded-full">
          <Layers className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng Danh mục</p>
          <h3 className="text-2xl font-bold text-gray-900">8</h3>
        </div>
      </div>

      {/* Total Products */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-emerald-50 rounded-full">
          <Package className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng Sản phẩm (Đang bán)</p>
          <h3 className="text-2xl font-bold text-gray-900">145</h3>
        </div>
      </div>

      {/* Best Selling Category */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-orange-50 rounded-full">
          <Award className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Danh mục bán chạy nhất</p>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">Rau củ hữu cơ</h3>
        </div>
      </div>
    </div>
  );
};

export default CategoryStats;