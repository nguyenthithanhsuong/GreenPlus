import React from 'react';

const Charts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart Mockup */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">Tăng trưởng doanh thu & Đơn hàng</h3>
          <div className="w-24 h-6 bg-gray-100 rounded-md"></div>
        </div>
        {/* CSS Mockup of Bar Chart */}
        <div className="h-64 flex items-end justify-between gap-2 border-b border-gray-100 pb-2">
          {/* Mock Bars - In production replace with Recharts or Chart.js */}
          {[10, 20, 15, 30, 45, 60, 25, 40, 50, 80, 100].map((height, i) => (
             <div key={i} className="w-full relative group">
                <div 
                  className={`w-full rounded-t-sm transition-all duration-300 ${i === 1 ? 'bg-emerald-100' : 'bg-emerald-500 hover:bg-emerald-600'}`} 
                  style={{ height: `${height}%` }}
                ></div>
             </div>
          ))}
        </div>
      </div>

      {/* Donut Chart Mockup */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6">Phân khúc Khách hàng</h3>
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 36 36" className="w-full h-full text-emerald-500">
              <path
                className="text-gray-100"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray="100, 100"
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-gray-900">100%</span>
            </div>
          </div>
          
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span><span className="text-gray-600">Khách hàng cũ (Returning)</span></div>
              <span className="font-medium">55%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span><span className="text-gray-600">Khách hàng mới (New)</span></div>
              <span className="font-medium">25%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span><span className="text-gray-600">Khách VIP (High Spender)</span></div>
              <span className="font-medium">20%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;