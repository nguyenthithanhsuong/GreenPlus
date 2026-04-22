import React from 'react';
import { Camera, Home, Save } from 'lucide-react';

const ProfileForm = () => {
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
      
      {/* Form Header */}
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Thông tin cơ bản</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cập nhật ảnh đại diện và chi tiết liên hệ của tài khoản quản lý.
        </p>
      </div>

      {/* Avatar Section */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <img 
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
            alt="Avatar" 
            className="w-20 h-20 rounded-full object-cover border border-gray-200"
          />
          <button className="absolute bottom-0 right-0 p-1.5 bg-[#059669] text-white rounded-full border-2 border-white hover:bg-[#047857] transition-colors">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Thanh Sương</h3>
          <p className="text-sm text-gray-500 mb-2">Manager tại <span className="font-semibold text-gray-700">GreenFarm Củ Chi</span></p>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              Đổi ảnh
            </button>
            <button className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Form Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
          <input 
            type="text" 
            defaultValue="Thanh Sương" 
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
          <input 
            type="email" 
            defaultValue="suongmanager@gmail.com" 
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
          <input 
            type="text" 
            defaultValue="0987 654 321" 
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Vai trò (Role)</label>
          <input 
            type="text" 
            defaultValue="Manager (Quản lý cửa hàng)" 
            disabled
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Store Information Section */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
        <Home className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Thông tin Cơ sở</h4>
          <p className="text-xs text-blue-700 mt-1">Đây là địa chỉ lấy hàng mặc định cho các Shipper thuộc quản lý của bạn.</p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tên Cửa hàng / Kho vận</label>
          <input 
            type="text" 
            defaultValue="GreenFarm Củ Chi" 
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ cửa hàng</label>
          <textarea 
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors resize-none"
          ></textarea>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </button>
      </div>

    </div>
  );
};

export default ProfileForm;