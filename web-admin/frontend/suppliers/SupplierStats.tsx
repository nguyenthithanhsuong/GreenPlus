import React from 'react';
import { ListOrdered, CheckCircle2, Clock, XCircle } from 'lucide-react';

const SupplierStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-full">
          <ListOrdered className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng số đối tác</p>
          <h3 className="text-2xl font-bold text-gray-900">156</h3>
        </div>
      </div>

      {/* Active */}
      <div className="bg-white p-5 rounded-xl border border-emerald-50 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-full">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đang hoạt động</p>
          <h3 className="text-2xl font-bold text-gray-900">142</h3>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
        {/* subtle highlight effect */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
        <div className="p-3 bg-yellow-50 rounded-full">
          <Clock className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Chờ duyệt (Pending)</p>
          <h3 className="text-2xl font-bold text-gray-900">3</h3>
        </div>
      </div>

      {/* Rejected */}
      <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
        <div className="p-3 bg-red-50 rounded-full">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Bị từ chối / Khóa</p>
          <h3 className="text-2xl font-bold text-gray-900">11</h3>
        </div>
      </div>
    </div>
  );
};

export default SupplierStats;