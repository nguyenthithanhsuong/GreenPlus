import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { ProductRow, ProductStatus } from '../../backend/modules/catalog/product-management.types';

type ProductTab = 'all' | ProductStatus;

type ProductTableProps = {
  products: ProductRow[];
  loading: boolean;
  saving: boolean;
  onEdit: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
  onToggleStatus: (product: ProductRow, nextStatus: ProductStatus) => void;
};

const PAGE_SIZE = 8;

const buildPageItems = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('vi-VN');
}

function getStatusStyles(status: ProductStatus) {
  if (status === 'active') {
    return {
      dot: 'bg-[#059669]',
      text: 'text-[#047857]',
      label: 'Đang bán',
    };
  }

  return {
    dot: 'bg-gray-400',
    text: 'text-gray-500',
    label: 'Ngừng bán',
  };
}

const ProductTable = ({ products, loading, saving, onEdit, onDelete, onToggleStatus }: ProductTableProps) => {
  const [activeTab, setActiveTab] = React.useState<ProductTab>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');

  const statusCounts = React.useMemo(
    () => ({
      active: products.filter((product) => product.status === 'active').length,
      inactive: products.filter((product) => product.status === 'inactive').length,
    }),
    [products]
  );

  const filteredProducts = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus = activeTab === 'all' || product.status === activeTab;
      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        product.name,
        product.category_name ?? '',
        product.unit,
        product.description ?? '',
        product.nutrition ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeTab, products, searchQuery]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  React.useEffect(() => {
    setCurrentPage((previous) => {
      if (previous > totalPages) {
        return totalPages;
      }

      if (previous < 1) {
        return 1;
      }

      return previous;
    });
  }, [totalPages]);

  const visibleProducts = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredProducts]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageItems = React.useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Đang bán
            <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">{statusCounts.active}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'inactive' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Ngừng bán
            <span className="flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full">{statusCounts.inactive}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="text"
              placeholder="Tìm sản phẩm"
              className="h-9 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Thông tin Sản phẩm</th>
              <th className="px-6 py-4 font-medium">Danh mục</th>
              <th className="px-6 py-4 font-medium">Đơn vị tính</th>
              <th className="px-6 py-4 font-medium">Dinh dưỡng</th>
              <th className="px-6 py-4 font-medium">Ngày tạo</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr key={product.product_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-400 shrink-0">
                        SP
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 mb-0.5">{product.name}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-2">{product.description || 'Chưa có mô tả'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {product.category_name || 'Chưa phân loại'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700 font-medium">
                  {product.unit}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {product.nutrition || '-'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(product.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusStyles(product.status).dot}`}></span>
                    <span className={`font-semibold text-xs ${getStatusStyles(product.status).text}`}>
                      {getStatusStyles(product.status).label}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-60"
                      title="Sửa"
                      disabled={saving}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(product, product.status === 'active' ? 'inactive' : 'active')}
                      className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-60"
                      title={product.status === 'active' ? 'Ngừng bán' : 'Kích hoạt'}
                      disabled={saving}
                    >
                      {product.status === 'active' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
                      title="Xóa"
                      disabled={saving}
                    >
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
          Hiển thị <span className="font-bold text-gray-900">{startItem} - {endItem}</span> trong tổng số <span className="font-bold text-gray-900">{totalItems}</span> sản phẩm
        </span>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage === 1}
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageItems.map((item, index) => {
            if (item === 'ellipsis') {
              return <span key={`ellipsis-${index}`} className="px-1 text-gray-400">...</span>;
            }

            const isActive = item === currentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(item)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${isActive ? 'border border-emerald-500 bg-emerald-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductTable;