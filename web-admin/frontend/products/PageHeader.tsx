import React from 'react';
import { Plus } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Danh mục Sản phẩm gốc</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý thông tin gốc của sản phẩm: Tên, Hình ảnh, Đơn vị tính và Nhà cung cấp.
        </p>
      </div>
      
      <div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Tạo Sản phẩm mới
        </button>
      </div>
    </div>
  );
};

export default PageHeader;