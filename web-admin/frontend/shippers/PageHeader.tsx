import React from 'react';
import { Map } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Phân phối Shipper</h1>
        <p className="text-gray-500 text-sm">
          Điều phối nhân viên giao hàng cho các đơn hàng đã đóng gói xong.
        </p>
      </div>
      <div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Map className="w-4 h-4" />
          Bản đồ tuyến đường
        </button>
      </div>
    </div>
  );
};

export default PageHeader;