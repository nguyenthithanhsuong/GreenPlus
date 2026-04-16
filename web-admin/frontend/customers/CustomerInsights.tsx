import React from 'react';
import { CalendarDays } from 'lucide-react';

// Mock Data for Top Customers
const topCustomers = [
  {
    id: 1,
    name: 'Lê Hoàng Nam',
    email: 'namle.h@gmail.com',
    avatar: 'https://i.pravatar.cc/150?u=a1',
    rank: 'VIP Diamond',
    rankBg: 'bg-yellow-100',
    rankText: 'text-yellow-700',
    orders: 142,
    spent: '45,500,000 đ',
  },
  {
    id: 2,
    name: 'Trần Ngọc Bích',
    email: 'bichngoc.tran@yahoo.com',
    avatar: 'https://i.pravatar.cc/150?u=a2',
    rank: 'VIP Gold',
    rankBg: 'bg-yellow-50',
    rankText: 'text-yellow-600',
    orders: 98,
    spent: '28,200,000 đ',
  },
  {
    id: 3,
    name: 'Nguyễn Thanh Tuấn',
    email: 'tuannm.corp@tech.vn',
    avatar: 'https://i.pravatar.cc/150?u=a3',
    rank: 'Silver',
    rankBg: 'bg-gray-100',
    rankText: 'text-gray-600',
    orders: 45,
    spent: '12,450,000 đ',
  },
  {
    id: 4,
    name: 'Phạm Thu Hà',
    email: 'hapt99@gmail.com',
    avatar: 'https://i.pravatar.cc/150?u=a4',
    rank: 'Silver',
    rankBg: 'bg-gray-100',
    rankText: 'text-gray-600',
    orders: 32,
    spent: '9,800,000 đ',
  },
];

const CustomerInsights = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Top Customers Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Top Khách hàng (Chi tiêu cao nhất)</h3>
          <a href="#" className="text-sm font-semibold text-[#059669] hover:underline">Xem tất cả</a>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="px-5 py-4 font-medium">Khách hàng</th>
                <th className="px-5 py-4 font-medium">Hạng (Rank)</th>
                <th className="px-5 py-4 font-medium">Số Đơn</th>
                <th className="px-5 py-4 font-medium text-right">Tổng chi tiêu</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${user.rankBg} ${user.rankText}`}>
                      {user.rank.includes('VIP') && <span className="w-2.5 h-2.5">👑</span>}
                      {user.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.orders}</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">{user.spent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shopping Habits */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Thói quen mua sắm</h3>
          <CalendarDays className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="p-5 flex-1">
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Tỷ lệ các danh mục được khách hàng mua nhiều nhất (dựa trên số lượng sản phẩm).
          </p>

          <div className="space-y-6">
            {/* Organic Veggies */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-800">Rau củ hữu cơ</span>
                <span className="text-sm font-bold text-[#059669]">45%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#059669] rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Imported Fruits */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-800">Trái cây nhập khẩu / VietGAP</span>
                <span className="text-sm font-bold text-blue-500">28%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            {/* Meat/Fish/Eggs */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-800">Thịt, Cá, Trứng tươi</span>
                <span className="text-sm font-bold text-orange-500">18%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>

            {/* Spices & Others */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-800">Gia vị & Khác</span>
                <span className="text-sm font-bold text-gray-500">9%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: '9%' }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default CustomerInsights;