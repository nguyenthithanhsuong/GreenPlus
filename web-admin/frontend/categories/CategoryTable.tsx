import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

// Mock Data
const categories = [
  {
    id: 1,
    initials: 'RC',
    colorClass: 'bg-emerald-100 text-emerald-700',
    name: 'Rau củ hữu cơ',
    description: 'Các loại rau ăn lá, củ quả đạt chứng nhận VietGAP, GlobalGAP.',
    productCount: 45,
  },
  {
    id: 2,
    initials: 'TC',
    colorClass: 'bg-orange-100 text-orange-700',
    name: 'Trái cây nội địa',
    description: 'Trái cây đặc sản các vùng miền Việt Nam, thu hoạch trong ngày.',
    productCount: 32,
  },
  {
    id: 3,
    initials: 'T',
    colorClass: 'bg-blue-100 text-blue-700',
    name: 'Thịt tươi sống',
    description: 'Thịt heo, bò, gà đạt chuẩn an toàn vệ sinh thực phẩm.',
    productCount: 28,
  },
  {
    id: 4,
    initials: 'TS',
    colorClass: 'bg-teal-100 text-teal-700',
    name: 'Thủy hải sản',
    description: 'Tôm, cá, mực tươi đánh bắt tự nhiên hoặc nuôi chuẩn sinh học.',
    productCount: 15,
  },
  {
    id: 5,
    initials: 'GV',
    colorClass: 'bg-purple-100 text-purple-700',
    name: 'Gia vị hữu cơ',
    description: 'Nước mắm, đường, muối chuẩn organic. (Đang chờ nhập hàng)',
    productCount: 0,
  },
];

const CategoryTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium w-[25%]">Tên Danh mục</th>
              <th className="px-6 py-4 font-medium w-[45%]">Mô tả (Description)</th>
              <th className="px-6 py-4 font-medium text-center">Số sản phẩm</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${category.colorClass}`}>
                      {category.initials}
                    </div>
                    <span className="font-bold text-gray-900">{category.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-500 leading-relaxed pr-8">
                    {category.description}
                  </p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                    {category.productCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Sửa">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default CategoryTable;