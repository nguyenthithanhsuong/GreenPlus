import React from "react";
import { Edit2, Search, Trash2 } from "lucide-react";
import type { CategoryRow } from "../../backend/modules/catalog/category-management.types";

type CategoryTableProps = {
  categories: CategoryRow[];
  loading: boolean;
  saving: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onEdit: (category: CategoryRow) => void;
  onDelete: (category: CategoryRow) => void;
};

const colorClasses = [
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

const getInitials = (name: string) => {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  const initials = tokens.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("");
  return initials || "CT";
};

const CategoryTable = ({ categories, loading, saving, searchQuery, onSearchQueryChange, onEdit, onDelete }: CategoryTableProps) => {
  const emptyMessage = searchQuery.trim() ? "Không tìm thấy danh mục phù hợp." : "Chưa có danh mục nào.";
  const [deletingCategory, setDeletingCategory] = React.useState<CategoryRow | null>(null);

  const closeDeleteModal = React.useCallback(() => {
    setDeletingCategory(null);
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (!deletingCategory) {
      return;
    }

    onDelete(deletingCategory);
    closeDeleteModal();
  }, [closeDeleteModal, deletingCategory, onDelete]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex justify-end border-b border-gray-100 px-6 py-4">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            type="text"
            placeholder="Tìm theo tên, mô tả, ảnh..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            <tr>
              <th className="w-[28%] px-6 py-4 font-medium">Danh mục</th>
              <th className="w-[42%] px-6 py-4 font-medium">Mô tả</th>
              <th className="px-6 py-4 font-medium text-center">Sản phẩm</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={4}>
                  Đang tải danh sách danh mục...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={4}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              categories.map((category, index) => {
                const badgeClass = colorClasses[index % colorClasses.length];
                const hasImage = Boolean(category.image_url?.trim());

                return (
                  <tr key={category.category_id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {hasImage ? (
                          <img
                            src={category.image_url as string}
                            alt={category.name}
                            className="h-10 w-10 shrink-0 rounded-xl border border-gray-200 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${badgeClass}`}>
                            {getInitials(category.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900">{category.name}</p>
                          {!hasImage ? <p className="text-[11px] text-gray-400">Chưa có ảnh</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 pr-8 leading-relaxed text-gray-500">
                        {category.description || "Chưa có mô tả."}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                        {category.product_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(category)}
                          disabled={saving}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
                          title="Sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCategory(category)}
                          disabled={saving}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={closeDeleteModal}
            aria-label="Đóng"
            disabled={saving}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa danh mục</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Bạn có chắc muốn xóa <span className="font-semibold text-gray-900">{deletingCategory.name}</span>? Hành động này không thể hoàn tác.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                Xóa danh mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTable;