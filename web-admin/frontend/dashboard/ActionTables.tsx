import React from 'react';
import { Store, Image as ImageIcon, PlaySquare, Check, X } from 'lucide-react';

const ActionTables = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Partners Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-500" />
            Đối tác chờ duyệt
          </h3>
          <a href="#" className="text-sm text-emerald-600 font-medium hover:underline">Xem tất cả</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-medium">Tên nhà cung cấp</th>
                <th className="px-5 py-3 font-medium">Chứng nhận</th>
                <th className="px-5 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900">Nông trại Rau Sạch Đà Lạt</p>
                  <p className="text-xs text-gray-400">Đăng ký: 2 giờ trước</p>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-medium border border-emerald-100">VietGAP</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors">
                    Kiểm duyệt
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900">Trang trại Heo Hữu Cơ BAF</p>
                  <p className="text-xs text-gray-400">Đăng ký: 1 ngày trước</p>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs font-medium border border-teal-100">GlobalGAP</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors">
                    Kiểm duyệt
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Content Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            Nội dung chờ duyệt
          </h3>
          <a href="#" className="text-sm text-emerald-600 font-medium hover:underline">Xem tất cả</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-medium">Người dùng / Loại</th>
                <th className="px-5 py-3 font-medium">Nội dung tóm tắt</th>
                <th className="px-5 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900">Nguyen Anh</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1"><PlaySquare className="w-3 h-3" /> Video</p>
                </td>
                <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]">
                  Cách làm Salad Keto với bơ và cà chua bi
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><X className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Check className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900">Trần Minh</p>
                  <p className="text-xs text-purple-600 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Post</p>
                </td>
                <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]">
                  Review rau sạch mùa mưa từ nông trại Green
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><X className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Check className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActionTables;