import React from 'react';
import { Users, DollarSign, Store, AlertCircle, TrendingUp } from 'lucide-react';

const StatCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Tổng Người Dùng</p>
          <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-4 h-4 text-blue-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">12,450</h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +12.5% <span className="text-gray-400 font-normal ml-1">so với tháng trước</span>
        </p>
      </div>

      {/* Total Revenue */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Tổng Doanh Thu</p>
          <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">854.2M ₫</h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +8.2% <span className="text-gray-400 font-normal ml-1">so với tháng trước</span>
        </p>
      </div>

      {/* Pending Partners */}
      <div className="bg-white p-5 rounded-xl border border-yellow-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Đối Tác Chờ Duyệt</p>
          <div className="p-2 bg-yellow-50 rounded-lg"><Store className="w-4 h-4 text-yellow-700" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">3</h3>
        <a href="#" className="text-xs text-yellow-600 font-medium hover:underline flex items-center">
          Xem & Duyệt ngay →
        </a>
      </div>

      {/* Pending Complaints */}
      <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Khiếu Nại Cần Xử Lý</p>
          <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="w-4 h-4 text-red-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">5</h3>
        <a href="#" className="text-xs text-red-600 font-medium hover:underline flex items-center">
          Xử lý ngay →
        </a>
      </div>
    </div>
  );
};

export default StatCards;