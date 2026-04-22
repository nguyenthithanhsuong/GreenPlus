import React from 'react';
import { Package, Truck, Users } from 'lucide-react';

const ShipperStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Urgent Assignment */}
      <div className="bg-white p-6 rounded-xl border-2 border-yellow-400 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-yellow-50 rounded-full">
          <Package className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-yellow-700 mb-1">Cần phân công gấp</p>
          <h3 className="text-2xl font-bold text-gray-900">12 <span className="text-base font-medium text-gray-600">đơn</span></h3>
        </div>
      </div>

      {/* Currently Delivering */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-gray-50 rounded-full">
          <Truck className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Đang được giao</p>
          <h3 className="text-2xl font-bold text-gray-900">24 <span className="text-base font-medium text-gray-600">đơn</span></h3>
        </div>
      </div>

      {/* Active Shippers */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="p-3.5 bg-gray-50 rounded-full">
          <Users className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Shipper đang hoạt động</p>
          <h3 className="text-2xl font-bold text-gray-900">5 <span className="text-base font-medium text-gray-600">người</span></h3>
        </div>
      </div>
    </div>
  );
};

export default ShipperStats;