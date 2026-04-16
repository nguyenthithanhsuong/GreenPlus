import React from 'react';
import { Store } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhà cung cấp</h1>
        <p className="text-gray-500 text-sm mt-1">
          Danh sách đối tác, nông trại phân phối thực phẩm sạch trên hệ thống.
        </p>
      </div>
      <div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Store className="w-4 h-4" />
          Thêm Nhà cung cấp
        </button>
      </div>
    </div>
  );
};

export default PageHeader;