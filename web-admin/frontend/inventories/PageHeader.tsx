import React from 'react';
import { Download } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Tồn kho</h1>
        <p className="text-gray-500 text-sm">
          Theo dõi số lượng thực tế, hàng chờ xuất và lịch sử biến động kho.
        </p>
      </div>
      <div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Báo cáo Kiểm kê
        </button>
      </div>
    </div>
  );
};

export default PageHeader;