import React from 'react';
import { MoreHorizontal } from 'lucide-react';

const CustomerCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Line Chart: Customer Growth */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">Tăng trưởng Khách hàng</h3>
          <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 relative min-h-[250px] w-full">
          {/* Mockup Line Chart using SVG */}
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 pb-6">
            {[700, 600, 500, 400, 300, 200, 100, 0].map((val) => (
              <div key={val} className="flex items-center w-full">
                <span className="w-8 text-right mr-3">{val}</span>
                <div className="flex-1 border-b border-gray-100 border-dashed"></div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 ml-11 mb-6">
            <svg viewBox="0 0 1000 250" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Fill Gradient Area */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M 0 200 L 90 180 L 180 160 L 270 120 L 360 140 L 450 100 L 540 80 L 630 60 L 720 10 L 810 -30 L 900 -70 L 1000 -120 L 1000 250 L 0 250 Z" 
                fill="url(#chartGradient)" 
              />
              {/* The Line */}
              <path 
                d="M 0 200 C 45 190, 45 180, 90 180 C 135 180, 135 160, 180 160 C 225 160, 225 120, 270 120 C 315 120, 315 140, 360 140 C 405 140, 405 100, 450 100 C 495 100, 495 80, 540 80 C 585 80, 585 60, 630 60 C 675 60, 675 10, 720 10 C 765 10, 765 -30, 810 -30 C 855 -30, 855 -70, 900 -70 C 950 -70, 950 -120, 1000 -120" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              {/* Data Points */}
              {[
                {x:0, y:200}, {x:90, y:180}, {x:180, y:160}, {x:270, y:120}, 
                {x:360, y:140}, {x:450, y:100}, {x:540, y:80}, {x:630, y:60}, 
                {x:720, y:10}, {x:810, y:-30}, {x:900, y:-70}, {x:1000, y:-120}
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="white" stroke="#10b981" strokeWidth="2" />
              ))}
            </svg>
          </div>
          {/* X-Axis Labels */}
          <div className="absolute bottom-0 left-11 right-0 flex justify-between text-xs text-gray-400">
            {['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Donut Chart: Customer Segments */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">Phân khúc Khách hàng</h3>
          <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
        
        <div className="flex flex-col items-center justify-center flex-1">
          {/* SVG Donut */}
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {/* Gray Segment (15%) */}
              <circle stroke="#e5e7eb" strokeWidth="6" fill="none" cx="18" cy="18" r="15" />
              {/* Orange Segment (30%) */}
              <circle stroke="#f59e0b" strokeWidth="6" strokeDasharray="45 100" strokeLinecap="butt" fill="none" cx="18" cy="18" r="15" />
              {/* Green Segment (55%) */}
              <circle stroke="#10b981" strokeWidth="6" strokeDasharray="55 100" strokeDashoffset="-45" strokeLinecap="butt" fill="none" cx="18" cy="18" r="15" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">12.5k</span>
              <span className="text-xs text-gray-500">Total Users</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span><span className="text-gray-600">Khách thường xuyên</span></div>
              <span className="font-bold text-gray-900">55%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2"></span><span className="text-gray-600">Khách VIP</span></div>
              <span className="font-bold text-gray-900">30%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 mr-2"></span><span className="text-gray-600">Khách mới (1 lần)</span></div>
              <span className="font-bold text-gray-900">15%</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CustomerCharts;