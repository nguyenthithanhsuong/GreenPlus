import React from 'react';
import { 
  Bell, 
  MapPin, 
  Info, 
  Phone, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { SCREEN_MAX_WIDTH_PX } from '../shared/screen.styles';

const OrderCard = ({ 
  orderId, 
  deliveryStatus, 
  paymentStatus, 
  paymentType, 
  customerName, 
  address, 
  codAmount, 
  orderDetails 
}) => {
  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm mx-4">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded">
            {deliveryStatus}
          </span>
          <span className="font-bold text-gray-800">{orderId}</span>
        </div>
        <span className={`text-sm font-medium ${paymentType === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
          {paymentStatus}
        </span>
      </div>

      {/* Destination Info */}
      <div className="flex gap-3 mb-4">
        <MapPin className="text-gray-800 mt-1" size={20} />
        <div>
          <p className="text-sm text-gray-500">Giao đến</p>
          <p className="font-bold text-lg text-gray-900">{customerName}</p>
          <p className="text-gray-600 text-sm mt-1">{address}</p>
        </div>
      </div>

      {/* COD & Details Box */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
          <span className="text-gray-600 text-sm">Tiền thu khách (COD):</span>
          <span className="font-bold text-lg text-gray-900">{codAmount}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Info size={16} />
          <span>{orderDetails}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-gray-800 font-medium active:bg-gray-50">
          <Phone size={18} />
          Gọi Khách
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-gray-800 font-medium active:bg-gray-50">
          <Navigation size={18} />
          Dẫn đường
        </button>
      </div>

      {/* Primary Action */}
      <div className="flex gap-2">
        <button className="flex items-center justify-center border border-gray-300 rounded-lg p-3 text-gray-800 active:bg-gray-50">
          <AlertTriangle size={20} />
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-[#129A48] text-white rounded-lg py-3 font-semibold active:bg-green-700">
          Đã giao thành công
          <CheckCircle2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default function DeliveryAppUI() {
  return (
    <div 
      className="min-h-screen bg-gray-100 pb-32 font-sans mx-auto relative shadow-2xl"
      style={{ 
        maxWidth: SCREEN_MAX_WIDTH_PX,
        width: "100%"
      }}
    >
      {/* App Header */}
      <header className="bg-[#129A48] text-white p-4 pt-8 rounded-b-xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium opacity-90">Xin chào, Giao Hàng</p>
            <h1 className="text-2xl font-bold mt-1">Đơn của tôi</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative bg-green-700 p-2 rounded-full">
              <Bell size={24} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#129A48]"></div>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
              {/* Placeholder for Avatar */}
              <img 
                src="/api/placeholder/40/40" 
                alt="Profile Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex bg-white shadow-sm mt-[-10px] pt-4 rounded-t-xl overflow-hidden">
        <div className="flex-1 flex items-center justify-center py-4 border-b-2 border-[#129A48] text-[#129A48] font-semibold">
          Chờ lấy hàng
          <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
        </div>
        <div className="flex-1 flex items-center justify-center py-4 border-b-2 border-transparent text-gray-500 font-medium">
          Đang giao
          <span className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
        </div>
      </div>

      {/* List Header */}
      <div className="p-4">
        <p className="text-gray-600 font-medium text-sm">Đang trên đường 2 đơn</p>
      </div>

      {/* Order Cards */}
      <OrderCard 
        orderId="#ORD-88895"
        deliveryStatus="Đang đi giao"
        paymentStatus="Đã thanh toán"
        paymentType="paid"
        customerName="Trần Ngọc Bích"
        address="45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
        codAmount="0 ₫"
        orderDetails="Đơn hàng gồm 3 sản phẩm (2kg)"
      />

      <OrderCard 
        orderId="#ORD-88896"
        deliveryStatus="Đang đi giao"
        paymentStatus="Thu hộ COD"
        paymentType="cod"
        customerName="Vương Gia Hân"
        address="Sảnh Park 1, Vinhomes Central Park, Phường 22, Quận Bình Thạnh, TP.HCM"
        codAmount="350.000 ₫"
        orderDetails="Đơn hàng gồm 1 sản phẩm (0.5kg)"
      />
    </div>
  );
}