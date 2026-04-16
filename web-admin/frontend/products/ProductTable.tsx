import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

// Mock Data
const products = [
  {
    id: 1,
    name: 'Cà chua Cherry Thủy Canh',
    dateAdded: 'Thêm ngày: 15/01/2026',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100&h=100',
    unit: 'Hộp 500g',
    category: 'Rau củ hữu cơ',
    supplier: 'Nông trại Rau Sạch Đà Lạt',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Xà Lách Thủy Canh',
    dateAdded: 'Thêm ngày: 10/02/2026',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=100&h=100',
    unit: 'Kg',
    category: 'Rau củ hữu cơ',
    supplier: 'Nông trại Rau Sạch Đà Lạt',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Ớt Chuông Đà Lạt',
    dateAdded: 'Thêm ngày: 05/01/2026',
    image: 'https://images.unsplash.com/photo-1563514227147-3843bbdd8df6?auto=format&fit=crop&q=80&w=100&h=100',
    unit: 'Kg',
    category: 'Rau củ hữu cơ',
    supplier: 'Nông trại Rau Sạch Đà Lạt',
    status: 'Inactive',
  },
];

const ProductTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls: Empty Filters (Mockup) */}
      <div className="flex flex-col md:flex-row md:items-center p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3 w-full max-w-2xl">
           <div className="h-10 w-full md:w-1/3 border border-gray-200 rounded-lg bg-white"></div>
           <div className="h-10 w-full md:w-1/3 border border-gray-200 rounded-lg bg-white"></div>
           <div className="h-10 w-full md:w-1/3 border border-gray-200 rounded-lg bg-white"></div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Thông tin Sản phẩm</th>
              <th className="px-6 py-4 font-medium">Đơn vị tính</th>
              <th className="px-6 py-4 font-medium">Danh mục</th>
              <th className="px-6 py-4 font-medium">Nhà cung cấp</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0" 
                    />
                    <div>
                      <p className="font-bold text-gray-900 mb-0.5">{product.name}</p>
                      <p className="text-[11px] text-gray-400">{product.dateAdded}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700 font-medium">
                  {product.unit}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {product.supplier}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'Active' ? 'bg-[#059669]' : 'bg-gray-400'}`}></span>
                    <span className={`font-semibold text-xs ${product.status === 'Active' ? 'text-[#059669]' : 'text-gray-500'}`}>
                      {product.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Sửa">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
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
          Hiển thị <span className="font-bold text-gray-900">1 - 3</span> trong tổng số <span className="font-bold text-gray-900">324</span> sản phẩm
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

export default ProductTable;