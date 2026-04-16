import React from 'react';
import { Package, Tag, Globe, Edit2, Trash2 } from 'lucide-react';

// Mock Data
const prices = [
  {
    id: 1,
    productName: 'Cà chua Cherry Thủy Canh',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100&h=100',
    scopeText: 'Áp dụng Chung (Tất cả lô)',
    scopeIcon: Globe,
    scopeColor: 'text-blue-600 bg-blue-50 border-blue-100',
    price: '65.000 đ',
    priceColor: 'text-gray-900',
    oldPrice: null,
    date: '10/03/2026',
    statusText: 'Đang áp dụng',
    statusColor: 'text-[#059669]',
    canDelete: false,
  },
  {
    id: 2,
    productName: 'Xà Lách Thủy Canh',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=100&h=100',
    scopeText: 'Lô: BCH-20260318-05',
    scopeIcon: Package,
    scopeColor: 'text-orange-700 bg-orange-50 border-orange-100',
    price: '35.000 đ',
    priceColor: 'text-red-600',
    oldPrice: '45.000 đ',
    date: '20/03/2026',
    statusText: null,
    statusColor: '',
    canDelete: true,
  },
  {
    id: 3,
    productName: 'Cà chua Cherry Thủy Canh',
    image: 'https://images.unsplash.com/photo-1563514227147-3843bbdd8df6?auto=format&fit=crop&q=80&w=100&h=100',
    scopeText: 'Áp dụng Chung',
    scopeIcon: Globe,
    scopeColor: 'text-gray-600 bg-gray-100 border-gray-200',
    price: '60.000 đ',
    priceColor: 'text-gray-400',
    oldPrice: null,
    date: '01/01/2026',
    statusText: '(Đã thay thế)',
    statusColor: 'text-gray-400',
    canDelete: false,
  },
];

const PriceTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Tabs - Inverted Active State */}
      <div className="flex items-center gap-6 px-6 border-b border-gray-100">
        <button className="flex items-center gap-2 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <Package className="w-4 h-4" /> Quản lý Lô hàng (Batches)
        </button>
        <button className="flex items-center gap-2 py-4 text-sm font-bold text-[#059669] border-b-2 border-[#059669]">
          <Tag className="w-4 h-4" /> Bảng giá & Lịch sử giá (Prices)
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3">
           <div className="h-9 w-40 md:w-56 border border-gray-200 rounded-lg bg-white"></div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Tag className="w-4 h-4" /> Thiết lập Giá mới
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium w-[30%]">Sản phẩm</th>
              <th className="px-6 py-4 font-medium">Phạm vi áp dụng (Batch)</th>
              <th className="px-6 py-4 font-medium text-center">Mức Giá (VNĐ)</th>
              <th className="px-6 py-4 font-medium text-center">Ngày bắt đầu áp dụng</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                {/* Product Col */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={item.image} 
                      alt={item.productName} 
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" 
                    />
                    <span className={`font-bold ${item.priceColor === 'text-gray-400' ? 'text-gray-500' : 'text-gray-900'}`}>
                      {item.productName}
                    </span>
                  </div>
                </td>
                
                {/* Scope Col */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${item.scopeColor}`}>
                    <item.scopeIcon className="w-3.5 h-3.5" /> {item.scopeText}
                  </span>
                </td>

                {/* Price Col */}
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`font-bold text-[15px] ${item.priceColor}`}>
                      {item.price}
                    </span>
                    {item.oldPrice && (
                      <span className="text-[11px] font-medium text-gray-400 line-through mt-0.5">
                        {item.oldPrice}
                      </span>
                    )}
                  </div>
                </td>

                {/* Date Col */}
                <td className="px-6 py-4 text-center">
                  <p className={`font-medium ${item.statusText === '(Đã thay thế)' ? 'text-gray-400' : 'text-gray-700'}`}>
                    {item.date}
                  </p>
                  {item.statusText && (
                    <p className={`text-[10px] font-bold mt-0.5 ${item.statusColor}`}>
                      {item.statusText}
                    </p>
                  )}
                </td>

                {/* Actions Col */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Sửa">
                      <Edit2 className="w-4 h-4" />
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

    </div>
  );
};

export default PriceTable;