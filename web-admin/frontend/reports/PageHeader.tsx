import React from 'react';
import { Download } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Tài chính</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý doanh thu, lợi nhuận, chiết khấu và theo dõi dòng tiền hệ thống.
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Date Filter Controls */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1">
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition-colors">
            7 ngày qua
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-[#059669] bg-emerald-50 rounded-md transition-colors">
            Tháng này
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition-colors">
            Năm nay
          </button>
        </div>
        
        {/* Export Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>
    </div>
  );
};

export default PageHeader;