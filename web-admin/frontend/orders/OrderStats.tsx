import React from 'react';

const OrderStats = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Total Today */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
        <p className="text-sm font-medium text-gray-500 mb-1">Tổng Đơn Hôm Nay</p>
        <h3 className="text-2xl font-bold text-gray-900">128</h3>
      </div>

      {/* Pending (Chờ xác nhận) */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 border-t-4 border-t-yellow-400 shadow-sm flex flex-col justify-center">
        <p className="text-sm font-bold text-yellow-600 mb-1">Chờ xác nhận</p>
        <h3 className="text-2xl font-bold text-gray-900">15</h3>
      </div>

      {/* Preparing (Đang chuẩn bị) */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 border-t-4 border-t-blue-500 shadow-sm flex flex-col justify-center">
        <p className="text-sm font-bold text-blue-600 mb-1">Đang chuẩn bị</p>
        <h3 className="text-2xl font-bold text-gray-900">24</h3>
      </div>

      {/* Delivering (Đang giao) */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 border-t-4 border-t-purple-500 shadow-sm flex flex-col justify-center">
        <p className="text-sm font-bold text-purple-600 mb-1">Đang giao</p>
        <h3 className="text-2xl font-bold text-gray-900">42</h3>
      </div>

      {/* Completed (Hoàn thành) */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 border-t-4 border-t-[#059669] shadow-sm flex flex-col justify-center">
        <p className="text-sm font-bold text-[#059669] mb-1">Hoàn thành</p>
        <h3 className="text-2xl font-bold text-gray-900">45</h3>
      </div>
    </div>
  );
};

export default OrderStats;