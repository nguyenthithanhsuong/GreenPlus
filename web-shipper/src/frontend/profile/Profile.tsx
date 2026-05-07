import React from "react";
import { 
  Camera, 
  Package, 
  Star, 
  History, 
  Check 
} from "lucide-react";
import { SCREEN_MAX_WIDTH_PX } from "../shared/screen.styles";

interface DeliveryHistoryItemProps {
  orderId: string;
  time: string;
  address: string;
  codText: string;
  isPaidText?: string;
}

const DeliveryHistoryItem = ({ orderId, time, address, codText, isPaidText }: DeliveryHistoryItemProps) => (
  <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
    <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F0FDF4] text-[#129A48]">
      <Check size={20} strokeWidth={3} />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-900">{orderId}</h4>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <p className="mt-1 text-sm text-gray-600 line-clamp-1">{address}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">
        {codText}
        {isPaidText && <span className="text-[#129A48]"> {isPaidText}</span>}
      </p>
    </div>
  </div>
);

export default function ProfileScreen() {
  return (
    <div 
      className="min-h-screen bg-gray-50 pb-32 font-sans mx-auto relative shadow-2xl"
      style={{ 
        maxWidth: SCREEN_MAX_WIDTH_PX,
        width: "100%"
      }}
    >
      {/* Green Header Background */}
      <div className="bg-[#129A48] pt-12 pb-24 text-center px-4">
        <h1 className="text-xl font-bold text-white">Hồ sơ cá nhân</h1>
      </div>

      {/* Main Content Area (Overlapping the header) */}
      <div className="px-4 -mt-16">
        
        {/* Profile Info Card */}
        <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-sm">
              <img 
                src="/api/placeholder/100/100" 
                alt="Profile avatar" 
                className="h-full w-full object-cover"
              />
            </div>
            <button className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#129A48] text-white shadow-sm">
              <Camera size={16} />
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900">Lê Văn Giao Hàng</h2>
          <p className="mt-1 text-sm text-gray-500">Mã NV: EMP-8821</p>

          <div className="mt-3 flex items-center gap-2 rounded-full bg-[#F0FDF4] px-4 py-1.5 border border-[#DCFCE7]">
            <div className="h-2 w-2 rounded-full bg-[#129A48]"></div>
            <span className="text-sm font-semibold text-[#129A48]">Đang hoạt động</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-700">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 leading-tight mb-1">
                Đã giao<br />(Tháng)
              </p>
              <p className="text-2xl font-bold text-gray-900">142</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Star size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Đánh giá</p>
              <p className="text-2xl font-bold text-gray-900">
                4.9<span className="text-lg text-gray-400 font-medium"> /5</span>
              </p>
            </div>
          </div>
        </div>

        {/* Delivery History List */}
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <History size={20} />
              <h3 className="text-lg">Lịch sử giao hàng</h3>
            </div>
            <button className="text-sm font-semibold text-[#129A48]">
              Xem tất cả
            </button>
          </div>

          <div className="flex flex-col">
            <DeliveryHistoryItem 
              orderId="ORD-88890"
              time="Hôm nay, 14:30"
              address="Vincom Landmark 81, Bình Thạnh"
              codText="Thu COD: 0đ"
              isPaidText="(Đã TT)"
            />
            <DeliveryHistoryItem 
              orderId="ORD-88885"
              time="Hôm nay, 10:15"
              address="123 Nguyễn Văn Linh, Thủ Đức"
              codText="Thu COD: 350.000đ"
            />
          </div>
        </div>

      </div>
    </div>
  );
}