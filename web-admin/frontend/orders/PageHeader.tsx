import React from 'react';
import { Download } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
        <p className="text-gray-500 text-sm">
          Theo dõi, xác nhận và xử lý các đơn hàng từ khách hàng.
        </p>
      </div>
      <div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Xuất danh sách
        </button>
      </div>
    </div>
  );
};

export default PageHeader;