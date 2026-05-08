import React from 'react';
import { User, Shield, Bell, LogOut } from 'lucide-react';

const SettingsNav = () => {
  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
      {/* Active Link */}
      <button className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-[#059669] rounded-xl font-bold text-sm transition-colors text-left">
        <User className="w-4 h-4" />
        Hồ sơ cá nhân
      </button>
      
      {/* Inactive Links */}
      <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors text-left">
        <Shield className="w-4 h-4" />
        Bảo mật & Mật khẩu
      </button>
      
      <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors text-left">
        <Bell className="w-4 h-4" />
        Cài đặt thông báo
      </button>
      
      {/* Separator & Logout */}
      <div className="my-2 border-t border-gray-200"></div>
      
      <button className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors text-left">
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </button>
    </div>
  );
};

export default SettingsNav;