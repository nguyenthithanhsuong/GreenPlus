import React from 'react';
import { DollarSign, PieChart, Truck, Tag, TrendingUp } from 'lucide-react';

const ReportStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Tổng Doanh Thu</p>
          <div className="p-2 bg-emerald-50 rounded-full"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">1.25B <span className="text-base font-medium text-gray-500">VND</span></h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +15.2% <span className="text-gray-400 font-normal ml-1">so với kỳ trước</span>
        </p>
      </div>

      {/* Gross Profit */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Lợi Nhuận Gộp</p>
          <div className="p-2 bg-blue-50 rounded-full"><PieChart className="w-4 h-4 text-blue-500" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">320M <span className="text-base font-medium text-gray-500">VND</span></h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +8.5% <span className="text-gray-400 font-normal ml-1">so với kỳ trước</span>
        </p>
      </div>

      {/* Shipping Fees */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Phí Vận Chuyển</p>
          <div className="p-2 bg-orange-50 rounded-full"><Truck className="w-4 h-4 text-orange-500" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">85M <span className="text-base font-medium text-gray-500">VND</span></h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +12.1% <span className="text-gray-400 font-normal ml-1">so với kỳ trước</span>
        </p>
      </div>

      {/* Discounts & Vouchers */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-500">Chiết Khấu & Voucher</p>
          <div className="p-2 bg-pink-50 rounded-full"><Tag className="w-4 h-4 text-pink-500" /></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">42M <span className="text-base font-medium text-gray-500">VND</span></h3>
        <p className="text-xs text-emerald-600 flex items-center font-medium">
          <TrendingUp className="w-3 h-3 mr-1" /> +2.4% <span className="text-gray-400 font-normal ml-1">so với kỳ trước</span>
        </p>
      </div>
    </div>
  );
};

export default ReportStats;