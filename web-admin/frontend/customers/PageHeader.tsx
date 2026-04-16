import React from 'react';
import { Calendar } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Phân tích Khách hàng</h1>
        <p className="text-gray-500 text-sm mt-1">
          Theo dõi hành vi, phân khúc và thói quen mua sắm của người dùng hệ thống.
        </p>
      </div>
      
      {/* Date Filter Controls */}
      <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1">
        <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition-colors">
          7 ngày qua
        </button>
        <button className="px-4 py-1.5 text-sm font-medium text-[#059669] bg-emerald-50 rounded-md transition-colors">
          Tháng này
        </button>
        <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition-colors border-r border-gray-100">
          Năm nay
        </button>
        <button className="px-3 py-1.5 text-gray-400 hover:text-gray-900 transition-colors">
          <Calendar className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PageHeader;