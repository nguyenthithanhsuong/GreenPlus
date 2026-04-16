import React, { useState } from 'react';
import { Phone, Check, Eye } from 'lucide-react';
import OrderDetailPanel from './OrderDetailPanel';

// Mock Data
const orders = [
  {
    id: 1,
    orderId: 'ORD-88901',
    time: '10:30, Hôm nay',
    customerName: 'Lê Văn Khoa',
    phone: '090 123 4567',
    total: '350.000 đ',
    paymentText: 'COD (Chưa TT)',
    paymentClass: 'bg-gray-50 text-gray-600 border-gray-200',
    statusText: 'Pending',
    statusDot: 'bg-yellow-500',
    statusColor: 'text-yellow-600',
    subStatus: null,
    canAccept: true,
  },
  {
    id: 2,
    orderId: 'ORD-88900',
    time: '09:15, Hôm nay',
    customerName: 'Nguyễn Thị Hoa',
    phone: '098 765 4321',
    total: '1.250.000 đ',
    paymentText: 'VNPay (Đã TT)',
    paymentClass: 'bg-blue-50 text-blue-600 border-blue-200',
    statusText: 'Preparing',
    statusDot: 'bg-blue-500',
    statusColor: 'text-blue-600',
    subStatus: null,
    canAccept: false,
  },
  {
    id: 3,
    orderId: 'ORD-88895',
    time: '08:00, Hôm nay',
    customerName: 'Trần Ngọc Bích',
    phone: '091 222 3333',
    total: '420.000 đ',
    paymentText: 'MoMo (Đã TT)',
    paymentClass: 'bg-pink-50 text-pink-600 border-pink-200',
    statusText: 'Delivering',
    statusDot: 'bg-purple-500',
    statusColor: 'text-purple-600',
    subStatus: 'Shipper: L.V.Giao',
    canAccept: false,
  },
  {
    id: 4,
    orderId: 'ORD-88850',
    time: '18:30, Hôm qua',
    customerName: 'Phạm Văn Đồng',
    phone: '097 555 6666',
    total: '185.000 đ',
    paymentText: 'COD (Đã thu)',
    paymentClass: 'bg-gray-50 text-gray-600 border-gray-200',
    statusText: 'Completed',
    statusDot: 'bg-[#059669]',
    statusColor: 'text-[#059669]',
    subStatus: null,
    canAccept: false,
  },
  {
    id: 5,
    orderId: 'ORD-88849',
    time: '17:00, Hôm qua',
    customerName: 'Hoàng Kim',
    phone: '099 888 7777',
    total: '850.000 đ',
    paymentText: 'VNPay (Hoàn tiền)',
    paymentClass: 'bg-gray-50 text-gray-500 border-gray-200',
    statusText: 'Cancelled',
    statusDot: 'bg-red-500',
    statusColor: 'text-red-500',
    subStatus: null,
    canAccept: false,
  },
];

const OrderTable = () => {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Tabs & Date Filters */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between p-5 border-b border-gray-50 gap-4">
          <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
            <button className="px-4 py-1.5 text-sm font-bold bg-white shadow-sm rounded-md text-gray-900 whitespace-nowrap">
              Tất cả
            </button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap flex items-center gap-1.5">
              Chờ xác nhận
              <span className="flex items-center justify-center px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">15</span>
            </button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đang chuẩn bị</button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đang giao</button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Hoàn thành</button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đã hủy</button>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 w-32 md:w-40 border border-gray-200 rounded-lg bg-white"></div>
            <span className="text-gray-400">-</span>
            <div className="h-9 w-32 md:w-40 border border-gray-200 rounded-lg bg-white"></div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Mã Đơn / Ngày đặt</th>
                <th className="px-6 py-4 font-medium">Khách hàng</th>
                <th className="px-6 py-4 font-medium text-center">Tổng tiền</th>
                <th className="px-6 py-4 font-medium text-center">Thanh toán</th>
                <th className="px-6 py-4 font-medium text-center">Trạng thái (Status)</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#059669] mb-0.5">{order.orderId}</p>
                    <p className="text-[11px] text-gray-400">{order.time}</p>
                  </td>
                  
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 mb-0.5">{order.customerName}</p>
                    <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {order.phone}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900">{order.total}</span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold border ${order.paymentClass}`}>
                      {order.paymentText}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${order.statusDot}`}></span>
                        <span className={`font-bold text-[11px] ${order.statusColor}`}>
                          {order.statusText}
                        </span>
                      </div>
                      {order.subStatus && (
                        <p className="text-[10px] font-medium text-gray-500 mt-1">{order.subStatus}</p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {order.canAccept && (
                        <button className="p-1.5 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-full transition-colors" title="Xác nhận">
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order.orderId)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" 
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
          <span className="text-sm text-gray-500">
            Hiển thị <span className="font-bold text-gray-900">1 - 5</span> trong tổng số <span className="font-bold text-gray-900">128</span> đơn hàng
          </span>
          
          <div className="flex items-center gap-1">
            <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#059669] bg-[#059669] text-white rounded-lg text-sm font-medium">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">2</button>
            <span className="px-1 text-gray-400">...</span>
            <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">&gt;</button>
          </div>
        </div>

      </div>

      {/* Render the Slide-over Panel */}
      <OrderDetailPanel 
        isOpen={selectedOrder !== null} 
        onClose={() => setSelectedOrder(null)} 
        orderId={selectedOrder || ''} 
      />
    </>
  );
};

export default OrderTable;