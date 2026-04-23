import React from "react";
import { Award, Layers, Package } from "lucide-react";

type CategoryStatsProps = {
  totalCategories: number;
  totalProducts: number;
  topCategoryName: string;
};

const CategoryStats = ({ totalCategories, totalProducts, topCategoryName }: CategoryStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex items-center gap-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="rounded-full bg-gray-50 p-3.5">
          <Layers className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">Tổng danh mục</p>
          <h3 className="text-2xl font-bold text-gray-900">{totalCategories}</h3>
        </div>
      </div>

      <div className="flex items-center gap-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="rounded-full bg-emerald-50 p-3.5">
          <Package className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">Tổng sản phẩm đang gán</p>
          <h3 className="text-2xl font-bold text-gray-900">{totalProducts}</h3>
        </div>
      </div>

      <div className="flex items-center gap-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="rounded-full bg-orange-50 p-3.5">
          <Award className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">Danh mục nổi bật</p>
          <h3 className="line-clamp-1 text-lg font-bold text-gray-900">{topCategoryName}</h3>
        </div>
      </div>
    </div>
  );
};

export default CategoryStats;