import React from 'react';
import { ShieldAlert, Store, Truck, ShoppingBag, Users, Edit, Trash2 } from 'lucide-react';

// Data model matching the UI
const roles = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Là người quản lý và kiểm soát toàn bộ hoạt động của hệ thống, bao gồm người dùng, nhà cung cấp, nội dung và các cấu hình chung.',
    permissions: ['Full Access', 'Quản lý User', 'Duyệt Shop'],
    userCount: 2,
    isSystemDefault: true,
    cardBg: 'bg-[#FCF5FF]', // Light purple/pink tint
    iconBg: 'bg-[#F3E8FF]',
    iconColor: 'text-purple-600',
    Icon: ShieldAlert,
  },
  {
    id: 'manager',
    title: 'Manager (Chủ chợ)',
    description: 'Là người quản lý sản phẩm, lô hàng, giá bán và đơn hàng của cửa hàng mình trên hệ thống.',
    permissions: ['QL Sản phẩm', 'QL Đơn hàng', 'Tồn kho'],
    userCount: 45,
    isSystemDefault: true,
    cardBg: 'bg-[#F5F8FF]', // Light blue tint
    iconBg: 'bg-[#E0E7FF]',
    iconColor: 'text-blue-600',
    Icon: Store,
  },
  {
    id: 'employee',
    title: 'Employee (Shipper)',
    description: 'Là người thực hiện việc lấy hàng, kiểm tra, đóng gói và giao đơn hàng cho khách.',
    permissions: ['Nhận đơn giao', 'Cập nhật TT giao', 'Quét QR lô hàng'],
    userCount: 128,
    isSystemDefault: true,
    cardBg: 'bg-[#FFF9F5]', // Light orange tint
    iconBg: 'bg-[#FFEDD5]',
    iconColor: 'text-orange-600',
    Icon: Truck,
  },
  {
    id: 'customer',
    title: 'Customer',
    description: 'Là người sử dụng hệ thống để tìm kiếm, mua sắm thực phẩm sạch và theo dõi đơn hàng.',
    permissions: ['Mua sắm', 'Đánh giá', 'Đăng Blog'],
    userCount: '12.2k',
    isSystemDefault: true,
    cardBg: 'bg-white border border-gray-100', // Plain white
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-700',
    Icon: ShoppingBag,
  },
];

const RoleGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roles.map((role) => (
        <div 
          key={role.id} 
          className={`relative rounded-2xl p-6 flex flex-col h-full ${role.cardBg}`}
        >
          {/* Card Header */}
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${role.iconBg}`}>
              <role.Icon className={`w-6 h-6 ${role.iconColor}`} strokeWidth={1.5} />
            </div>
            {role.isSystemDefault && (
              <span className="px-3 py-1 bg-gray-100/80 text-gray-500 rounded-md text-[11px] font-semibold tracking-wide uppercase">
                System Default
              </span>
            )}
          </div>

          {/* Card Body */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{role.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {role.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {role.permissions.map((perm, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Card Footer */}
          <div className="pt-4 mt-auto border-t border-gray-200/50 flex items-center justify-between">
            <div className="flex items-center text-sm font-semibold text-gray-900">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              {role.userCount} <span className="font-normal text-gray-500 ml-1">tài khoản</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-white/50">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-white/50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoleGrid;