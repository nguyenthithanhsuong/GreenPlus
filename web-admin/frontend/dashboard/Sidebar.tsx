import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Store, 
  Image as ImageIcon, 
  AlertCircle, 
  PieChart, 
  DollarSign, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-[260px] h-screen bg-white border-r border-gray-100 flex flex-col font-sans">
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-gray-50">
        <img 
          src="https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/General/IconText.png" 
          alt="GreenPlus Logo" 
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        
        {/* Overview Group */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 px-3">
            Tổng quan
          </h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-[#059669] bg-[#F0FDF4] rounded-xl font-medium transition-colors">
                <LayoutDashboard className="w-[22px] h-[22px] mr-3 text-[#059669]" />
                <span className="text-[15px]">Dashboard</span>
              </a>
            </li>
          </ul>
        </div>

        {/* System Group */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 px-3">
            Hệ thống
          </h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
                <Users className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
                <span className="text-[15px]">Người dùng</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
                <Shield className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
                <span className="text-[15px]">Vai trò (Roles)</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
                <Store className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
                <span className="text-[15px]">Nhà cung cấp</span>
                <span className="ml-auto flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                  3
                </span>
              </a>
            </li>
          </ul>
        </div>

        {/* Monitoring & Reporting Group */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 px-3">
            Giám sát & Báo cáo
          </h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
                <ImageIcon className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
                <span className="text-[15px]">Kiểm duyệt nội dung</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
                <AlertCircle className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
                <span className="text-[15px]">Khiếu nại</span>
                <span className="ml-auto flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  5
                </span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
                <PieChart className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
                <span className="text-[15px]">Phân tích khách hàng</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
                <DollarSign className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
                <span className="text-[15px]">Báo cáo tài chính</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Settings (Bottom Fixed) */}
      <div className="p-4 border-t border-gray-100">
        <a href="#" className="flex items-center px-3 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group">
          <Settings className="w-[22px] h-[22px] mr-3 text-gray-800 group-hover:text-black" />
          <span className="text-[15px]">Cài đặt</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;