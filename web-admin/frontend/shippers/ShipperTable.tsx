import React from 'react';
import { Inbox, Navigation, Clock, Phone, MapPin, ChevronRight } from 'lucide-react';

// Mock Data
const unassignedOrders = [
  {
    id: 1,
    orderId: 'ORD-88900',
    waitTime: 'Đợi 45 phút',
    isUrgent: true,
    customer: 'Nguyễn Thị Hoa',
    phone: '098 765 4321',
    address: 'Số 15, Đường D5, Phường 25, Q. Bình Thạnh',
    distance: 'Cách cửa hàng: 5.2 km',
    codAmount: '0 đ',
    codColor: 'text-gray-900',
    paymentStatus: 'Đã thanh toán (VNPay)',
    paymentBadgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 2,
    orderId: 'ORD-88902',
    waitTime: 'Đợi 10 phút',
    isUrgent: false,
    customer: 'Lê Văn Khoa',
    phone: '090 123 4567',
    address: '123 Nguyễn Văn Linh, Phường Linh Trung, TP. Thủ Đức',
    distance: 'Cách cửa hàng: 2.1 km',
    codAmount: '350.000 đ',
    codColor: 'text-red-600',
    paymentStatus: 'Thu hộ COD',
    paymentBadgeColor: 'bg-gray-100 text-gray-600 border-gray-200',
  },
];

const ShipperTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 border-b border-gray-100">
        <button className="flex items-center gap-2 py-4 text-sm font-bold text-[#059669] border-b-2 border-[#059669]">
          <Inbox className="w-4 h-4" /> Đơn chưa phân công
          <span className="flex items-center justify-center px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full ml-1">12</span>
        </button>
        <button className="flex items-center gap-2 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <Navigation className="w-4 h-4" /> Đơn đã gán Shipper
        </button>
      </div>

      {/* Filters (Placeholders based on mockup) */}
      <div className="flex flex-col md:flex-row md:items-center p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3">
           <div className="h-9 w-40 md:w-48 border border-gray-200 rounded-lg bg-white"></div>
           <div className="h-9 w-40 md:w-48 border border-gray-200 rounded-lg bg-white"></div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Mã Đơn & Thời gian đợi</th>
              <th className="px-6 py-4 font-medium">Khách hàng</th>
              <th className="px-6 py-4 font-medium w-[35%]">Địa chỉ giao hàng</th>
              <th className="px-6 py-4 font-medium text-right">Phí thu (COD)</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {unassignedOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 align-top pt-5">
                  <p className="font-bold text-[#059669] mb-1">{order.orderId}</p>
                  <p className={`text-[11px] font-bold flex items-center gap-1 ${order.isUrgent ? 'text-red-500' : 'text-gray-500'}`}>
                    <Clock className="w-3 h-3" /> {order.waitTime}
                  </p>
                </td>
                
                <td className="px-6 py-4 align-top pt-5">
                  <p className="font-bold text-gray-900 mb-1">{order.customer}</p>
                  <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {order.phone}
                  </p>
                </td>

                <td className="px-6 py-4 align-top pt-5">
                  <p className="font-medium text-gray-800 mb-1 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    {order.address}
                  </p>
                  <p className="text-[11px] text-gray-500 ml-5.5">{order.distance}</p>
                </td>

                <td className="px-6 py-4 align-top pt-5 text-right">
                  <p className={`font-bold text-[15px] mb-1 ${order.codColor}`}>{order.codAmount}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${order.paymentBadgeColor}`}>
                    {order.paymentStatus}
                  </span>
                </td>

                <td className="px-6 py-4 align-middle text-right">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                    Chọn Shipper
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ShipperTable;