import React from 'react';
import { Users, UserPlus, RefreshCcw, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const CustomerStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Tổng Khách hàng (Users)</p>
          <div className="p-2 bg-blue-50 rounded-full"><Users className="w-4 h-4 text-blue-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">12,543</h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +12.5% <span className="text-gray-400 font-normal ml-1">so với tháng trước</span>
        </p>
      </div>

      {/* New Users */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Khách hàng mới (New)</p>
          <div className="p-2 bg-emerald-50 rounded-full"><UserPlus className="w-4 h-4 text-emerald-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">845</h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +5.2% <span className="text-gray-400 font-normal ml-1">so với tháng trước</span>
        </p>
      </div>

      {/* Retention Rate */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Tỷ lệ quay lại (Retention)</p>
          <div className="p-2 bg-purple-50 rounded-full"><RefreshCcw className="w-4 h-4 text-purple-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">68.4%</h3>
        <p className="text-xs text-red-500 flex items-center font-medium">
          <TrendingDown className="w-3 h-3 mr-1" /> -1.1% <span className="text-gray-400 font-normal ml-1">so với tháng trước</span>
        </p>
      </div>

      {/* AOV */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Giá trị TB đơn (AOV)</p>
          <div className="p-2 bg-orange-50 rounded-full"><CreditCard className="w-4 h-4 text-orange-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">350k</h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +8.4% <span className="text-gray-400 font-normal ml-1">so với tháng trước</span>
        </p>
      </div>
    </div>
  );
};

export default CustomerStats;