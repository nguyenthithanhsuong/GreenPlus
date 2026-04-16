import React from 'react';
import { AlertCircle, RefreshCcw, MessageSquare, CheckCircle2 } from 'lucide-react';

const ComplaintStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Pending */}
      <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Chờ xử lý (Pending)</p>
          <h3 className="text-2xl font-bold text-gray-900">5</h3>
        </div>
      </div>

      {/* Refunds / Returns */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-orange-50 rounded-full">
          <RefreshCcw className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Hoàn tiền / Đổi trả</p>
          <h3 className="text-2xl font-bold text-gray-900">3</h3>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-full">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Phản hồi (Feedback)</p>
          <h3 className="text-2xl font-bold text-gray-900">2</h3>
        </div>
      </div>

      {/* Resolved */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-full">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đã giải quyết (Tháng này)</p>
          <h3 className="text-2xl font-bold text-gray-900">128</h3>
        </div>
      </div>
    </div>
  );
};

export default ComplaintStats;