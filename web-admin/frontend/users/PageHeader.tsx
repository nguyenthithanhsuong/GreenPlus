import React from 'react';
import { Shield, UserPlus } from 'lucide-react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản trị toàn bộ danh sách tài khoản, phân quyền và trạng thái hoạt động trên hệ thống.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <Shield className="w-4 h-4" />
          Phân quyền Role
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>
    </div>
  );
};

export default PageHeader;