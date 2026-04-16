import React from 'react';
import { MoreHorizontal } from 'lucide-react';

const ReportCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Combo Chart: Revenue & Profit */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-gray-900">Doanh Thu & Lợi Nhuận</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Doanh thu
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Lợi nhuận
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative min-h-[250px] w-full">
          {/* Y-Axis & Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 pb-6">
            {[600, 500, 400, 300, 200, 100, 0].map((val) => (
              <div key={val} className="flex items-center w-full">
                <span className="w-8 text-right mr-3">{val}</span>
                <div className="flex-1 border-b border-gray-100 border-dashed"></div>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 ml-11 mb-6">
            <svg viewBox="0 0 1000 250" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Bars (Revenue) */}
              {[
                {x: 20, h: 45}, {x: 100, h: 58}, {x: 180, h: 70}, {x: 260, h: 80},
                {x: 340, h: 72}, {x: 420, h: 95}, {x: 500, h: 110}, {x: 580, h: 125},
                {x: 660, h: 145}, {x: 740, h: 170}, {x: 820, h: 195}, {x: 900, h: 225}
              ].map((bar, i) => (
                <rect key={i} x={bar.x} y={250 - bar.h} width="40" height={bar.h} fill="#22c55e" rx="4" />
              ))}

              {/* Line (Profit) */}
              <path 
                d="M 40 235 L 120 232 L 200 228 L 280 225 L 360 228 L 440 220 L 520 215 L 600 215 L 680 205 L 760 198 L 840 190 L 920 180" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3" 
              />

              {/* Line Data Points */}
              {[
                {x: 40, y: 235}, {x: 120, y: 232}, {x: 200, y: 228}, {x: 280, y: 225},
                {x: 360, y: 228}, {x: 440, y: 220}, {x: 520, y: 215}, {x: 600, y: 215},
                {x: 680, y: 205}, {x: 760, y: 198}, {x: 840, y: 190}, {x: 920, y: 180}
              ].map((pt, i) => (
                <circle key={`pt-${i}`} cx={pt.x} cy={pt.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2.5" />
              ))}
            </svg>
          </div>
          
          {/* X-Axis Labels */}
          <div className="absolute bottom-0 left-11 right-0 flex justify-between text-xs text-gray-400 pl-4 pr-10">
            {['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Donut Chart: Payment Methods */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">Phương thức thanh toán</h3>
          <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
        
        <div className="flex flex-col items-center justify-center flex-1">
          {/* SVG Donut */}
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {/* Stroke-dasharray values represent percentages. */}
              {/* VNPay (45%) - Blue */}
              <circle stroke="#3b82f6" strokeWidth="6" strokeDasharray="45 100" strokeDashoffset="25" strokeLinecap="butt" fill="none" cx="18" cy="18" r="15.91549430918954" />
              {/* MoMo (30%) - Pink */}
              <circle stroke="#ec4899" strokeWidth="6" strokeDasharray="30 100" strokeDashoffset="-20" strokeLinecap="butt" fill="none" cx="18" cy="18" r="15.91549430918954" />
              {/* Tiền mặt (20%) - Green */}
              <circle stroke="#10b981" strokeWidth="6" strokeDasharray="20 100" strokeDashoffset="-50" strokeLinecap="butt" fill="none" cx="18" cy="18" r="15.91549430918954" />
              {/* Thẻ tín dụng (5%) - Gray */}
              <circle stroke="#6b7280" strokeWidth="6" strokeDasharray="5 100" strokeDashoffset="-70" strokeLinecap="butt" fill="none" cx="18" cy="18" r="15.91549430918954" />
            </svg>
          </div>
          
          {/* Legend */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span><span className="text-gray-600">VNPay</span></div>
              <span className="font-bold text-gray-900">45%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 mr-2"></span><span className="text-gray-600">MoMo</span></div>
              <span className="font-bold text-gray-900">30%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span><span className="text-gray-600">Tiền mặt (COD)</span></div>
              <span className="font-bold text-gray-900">20%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-500 mr-2"></span><span className="text-gray-600">Thẻ tín dụng</span></div>
              <span className="font-bold text-gray-900">5%</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReportCharts;