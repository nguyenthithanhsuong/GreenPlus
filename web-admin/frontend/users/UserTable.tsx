import React from 'react';
import { Edit, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

// Mock Data
const users = [
  {
    id: 1,
    name: 'Phan Chí Cường',
    email: 'cuongpc@greenplus.vn',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    phone: '0901 234 567',
    role: 'Admin',
    joinDate: '15/01/2026',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Thanh Sương',
    email: 'suongmanager@gmail.com',
    avatar: '', // Triggers initial fallback
    initial: 'S',
    phone: '0987 654 321',
    role: 'Manager',
    joinDate: '02/02/2026',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Lê Văn Giao Hàng',
    email: 'shipper.le@greenplus.vn',
    avatar: 'https://i.pravatar.cc/150?u=3',
    phone: '0911 222 333',
    role: 'Employee',
    joinDate: '10/02/2026',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Nguyễn Ngọc An',
    email: 'an.nguyen@gmail.com',
    avatar: '',
    initial: 'A',
    phone: '0933 444 555',
    role: 'Customer',
    joinDate: '18/03/2026',
    status: 'Banned',
  },
];

// Helper to render role badges with specific colors
const renderRoleBadge = (role: string) => {
  const styles: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700',
    Manager: 'bg-blue-100 text-blue-700',
    Employee: 'bg-orange-100 text-orange-700',
    Customer: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  );
};

const UserTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls: Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
          <button className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md text-gray-900">Tất cả</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md">Khách hàng</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md">Nhân viên & Quản trị</button>
        </div>

        {/* Filters (Placeholders) */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 border border-gray-200 rounded-lg bg-gray-50"></div>
          <div className="h-9 w-32 border border-gray-200 rounded-lg bg-gray-50"></div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Tài khoản</th>
              <th className="px-6 py-4 font-medium">Số điện thoại</th>
              <th className="px-6 py-4 font-medium">Vai trò (Role)</th>
              <th className="px-6 py-4 font-medium">Ngày tham gia</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {user.initial}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                <td className="px-6 py-4">{renderRoleBadge(user.role)}</td>
                <td className="px-6 py-4 text-gray-600">{user.joinDate}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className={`font-medium ${user.status === 'Active' ? 'text-gray-700' : 'text-red-600'}`}>{user.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.role !== 'Admin' && (
                      <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Khóa">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">1 - 4</span> trong tổng số <span className="font-bold text-gray-900">12,450</span>
        </span>
        
        <div className="flex items-center gap-1">
          <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
          <button className="w-8 h-8 flex items-center justify-center border border-emerald-500 bg-emerald-500 text-white rounded-lg text-sm font-medium">1</button>
          <button className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">2</button>
          <button className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">3</button>
          <span className="px-1 text-gray-400">...</span>
          <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

    </div>
  );
};

export default UserTable;