import React from 'react';
import { ArrowLeftRight, History, Trash2 } from 'lucide-react';

// Mock Data
const inventory = [
  {
    id: 1,
    productName: 'Cà chua Cherry Thủy Canh',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100&h=100',
    batchId: 'BCH-20260320-01',
    available: 150,
    availableColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    reserved: 20,
    lastUpdated: 'Hôm nay, 08:30',
    canUpdate: true,
    updateColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    canDelete: false,
  },
  {
    id: 2,
    productName: 'Xà Lách Thủy Canh',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=100&h=100',
    batchId: 'BCH-20260318-05',
    available: 8,
    availableColor: 'bg-orange-50 text-orange-600 border-orange-100',
    reserved: 2,
    lastUpdated: 'Hôm qua, 15:20',
    canUpdate: true,
    updateColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    canDelete: false,
  },
  {
    id: 3,
    productName: 'Ớt Chuông Đà Lạt',
    image: 'https://images.unsplash.com/photo-1563514227147-3843bbdd8df6?auto=format&fit=crop&q=80&w=100&h=100',
    batchId: 'BCH-20260201-10',
    available: 0,
    availableColor: 'bg-gray-100 text-gray-500 border-gray-200',
    reserved: 0,
    lastUpdated: '10/02/2026',
    canUpdate: true,
    updateColor: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    canDelete: true,
  },
];

const InventoryTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3">
           <div className="h-10 w-48 border border-gray-200 rounded-lg bg-white"></div>
           <div className="h-10 w-48 border border-gray-200 rounded-lg bg-white"></div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium w-[25%]">Sản phẩm</th>
              <th className="px-6 py-4 font-medium">Mã Lô (Batch ID)</th>
              <th className="px-6 py-4 font-medium text-center">Tồn thực tế<br/><span className="font-normal">(Available)</span></th>
              <th className="px-6 py-4 font-medium text-center">Chờ giao<br/><span className="font-normal">(Reserved)</span></th>
              <th className="px-6 py-4 font-medium">Cập nhật lần cuối</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác Nhập/Xuất</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.image} 
                      alt={item.productName} 
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" 
                    />
                    <span className="font-bold text-gray-900 leading-tight pr-4">
                      {item.productName}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 text-gray-600 font-medium">
                  {item.batchId}
                </td>

                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded font-bold border ${item.availableColor}`}>
                    {item.available}
                  </span>
                </td>

                <td className="px-6 py-4 text-center font-bold text-gray-900">
                  {item.reserved}
                </td>

                <td className="px-6 py-4 text-gray-600 font-medium">
                  {item.lastUpdated}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-colors ${item.updateColor}`}>
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Cập nhật
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Lịch sử">
                      <History className="w-4 h-4" />
                    </button>
                    {item.canDelete && (
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
          Hiển thị <span className="font-bold text-gray-900">1 - 3</span> trong tổng số <span className="font-bold text-gray-900">45</span> lô hàng
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
  );
};

export default InventoryTable;