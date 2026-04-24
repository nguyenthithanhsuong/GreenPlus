"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import CategoryDrawer, { CategoryFormValues } from "./CategoryDrawer";
import CategoryStats from "./CategoryStats";
import CategoryTable from "./CategoryTable";
import type { CategoryRow } from "../../backend/modules/catalog/category-management.types";
import { categorySearchStrategy } from "../shared/searchStrategies";

const emptyForm = (): CategoryFormValues => ({
  name: "",
  description: "",
  imageUrl: "",
});

const CategoryManagement = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(emptyForm());
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const data = (await response.json()) as { items?: CategoryRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh mục");
      }

      setCategories(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh mục");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(
    () => categorySearchStrategy.filter(categories, deferredSearchQuery),
    [categories, deferredSearchQuery]
  );

  const stats = useMemo(() => {
    const totalProducts = categories.reduce((sum, category) => sum + category.product_count, 0);
    const topCategory = categories.reduce<CategoryRow | null>((best, category) => {
      if (!best || category.product_count > best.product_count) {
        return category;
      }

      return best;
    }, null);

    return {
      totalCategories: categories.length,
      totalProducts,
      topCategoryName: topCategory?.name ?? "Chưa có dữ liệu",
    };
  }, [categories]);

  const openCreateDrawer = useCallback(() => {
    setSelectedCategory(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((category: CategoryRow) => {
    setSelectedCategory(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      imageUrl: category.image_url ?? "",
    });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedCategory(null);
    setForm(emptyForm());
  }, []);

  const patchForm = useCallback((patch: Partial<CategoryFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const reloadData = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  const submitDrawer = useCallback(async () => {
    if (!form.name.trim()) {
      setError("Tên danh mục là bắt buộc");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(selectedCategory ? `/api/categories/${encodeURIComponent(selectedCategory.category_id)}` : "/api/categories", {
        method: selectedCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          imageUrl: form.imageUrl,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể lưu danh mục");
      }

      closeDrawer();
      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể lưu danh mục");
    } finally {
      setSaving(false);
    }
  }, [closeDrawer, form, reloadData, selectedCategory]);

  const handleUploadImage = useCallback(async (file: File) => {
    setUploadingImage(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/categories/image", {
        method: "POST",
        body,
      });

      const data = (await response.json()) as { publicUrl?: string; error?: string };
      if (!response.ok || !data.publicUrl) {
        throw new Error(data.error ?? "Upload ảnh danh mục thất bại");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.publicUrl ?? previous.imageUrl,
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Upload ảnh danh mục thất bại");
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const deleteCategory = useCallback(async (category: CategoryRow) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(category.category_id)}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể xóa danh mục");
      }

      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể xóa danh mục");
    } finally {
      setSaving(false);
    }
  }, [reloadData]);

  return (
    <AdminShell
      title="Quản lý danh mục"
      description="Tổ chức danh mục sản phẩm và điều hướng hiển thị trên hệ thống bán hàng."
      pageActions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void reloadData()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#047857] disabled:opacity-60"
            disabled={loading || saving}
          >
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        </div>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <CategoryStats {...stats} />

      <CategoryTable
        categories={filteredCategories}
        loading={loading}
        saving={saving}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onEdit={openEditDrawer}
        onDelete={deleteCategory}
      />

      <CategoryDrawer
        isOpen={drawerOpen}
        saving={saving}
        uploadingImage={uploadingImage}
        error={error}
        form={form}
        selectedCategory={selectedCategory}
        onClose={closeDrawer}
        onSubmit={() => {
          void submitDrawer();
        }}
        onChange={patchForm}
        onUploadImage={handleUploadImage}
      />
    </AdminShell>
  );
};

export default CategoryManagement;