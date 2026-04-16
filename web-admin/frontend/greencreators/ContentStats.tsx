import React from 'react';
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';

const ContentStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Pending */}
      <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <Clock className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Đang chờ duyệt</p>
          <h3 className="text-2xl font-bold text-gray-900">24</h3>
        </div>
      </div>

      {/* Approved Today */}
      <div className="bg-white p-5 rounded-xl border border-emerald-50 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-full">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đã duyệt (Hôm nay)</p>
          <h3 className="text-2xl font-bold text-gray-900">156</h3>
        </div>
      </div>

      {/* Rejected Today */}
      <div className="bg-white p-5 rounded-xl border border-red-50 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-50 rounded-full">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Từ chối (Hôm nay)</p>
          <h3 className="text-2xl font-bold text-gray-900">12</h3>
        </div>
      </div>

      {/* Total Content */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-full">
          <FileText className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng nội dung</p>
          <h3 className="text-2xl font-bold text-gray-900">4,520</h3>
        </div>
      </div>
    </div>
  );
};

export default ContentStats;