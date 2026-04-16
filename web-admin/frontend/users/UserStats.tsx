import React from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';

const UserStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-full">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng Người dùng</p>
          <h3 className="text-2xl font-bold text-gray-900">12,450</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-full">
          <UserCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đang hoạt động (Active)</p>
          <h3 className="text-2xl font-bold text-gray-900">12,100</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-50 rounded-full">
          <UserX className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Bị khóa (Banned/Inactive)</p>
          <h3 className="text-2xl font-bold text-gray-900">350</h3>
        </div>
      </div>
    </div>
  );
};

export default UserStats;