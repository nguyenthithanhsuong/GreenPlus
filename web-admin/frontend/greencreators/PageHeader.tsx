import React from 'react';
import { Settings2 } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt nội dung</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý và xét duyệt các bài viết, hình ảnh, video (Blog & Community) từ cộng đồng.
        </p>
      </div>
      <div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Settings2 className="w-4 h-4" />
          Cấu hình tự động duyệt
        </button>
      </div>
    </div>
  );
};

export default PageHeader;