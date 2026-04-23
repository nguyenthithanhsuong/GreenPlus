"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import ProductDrawer, { ProductFormValues } from "./ProductDrawer";
import ProductStats from "./ProductStats";
import ProductTable from "./ProductTable";
import type { CategoryRow, ProductRow, ProductStatus } from "../../backend/modules/catalog/product-management.types";

const emptyForm = (): ProductFormValues => ({
  categoryId: "",
  name: "",
  description: "",
  unit: "",
  imageUrl: "",
  nutrition: "",
  status: "active",
});

const ProductManagement = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyForm());

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = (await response.json()) as { items?: ProductRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách sản phẩm");
      }

      setProducts(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách sản phẩm");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const data = (await response.json()) as { items?: CategoryRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh mục");
      }

      setCategories(Array.isArray(data.items) ? data.items : []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
    void loadCategories();
  }, [loadCategories, loadProducts]);

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === "active").length;
    return {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts: products.length - activeProducts,
    };
  }, [products]);

  const openCreateDrawer = useCallback(() => {
    setSelectedProduct(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((product: ProductRow) => {
    setSelectedProduct(product);
    setForm({
      categoryId: product.category_id ?? "",
      name: product.name,
      description: product.description ?? "",
      unit: product.unit,
      imageUrl: product.image_url ?? "",
      nutrition: product.nutrition ?? "",
      status: product.status,
    });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedProduct(null);
    setForm(emptyForm());
  }, []);

  const patchForm = useCallback((patch: Partial<ProductFormValues>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const reloadData = useCallback(async () => {
    await Promise.all([loadProducts(), loadCategories()]);
  }, [loadCategories, loadProducts]);

  const submitDrawer = useCallback(async () => {
    if (!form.name.trim()) {
      setError("Tên sản phẩm là bắt buộc");
      return;
    }

    if (!form.unit.trim()) {
      setError("Đơn vị tính là bắt buộc");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(selectedProduct ? `/api/products/${encodeURIComponent(selectedProduct.product_id)}` : "/api/products", {
        method: selectedProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId || null,
          name: form.name,
          description: form.description,
          unit: form.unit,
          imageUrl: form.imageUrl,
          nutrition: form.nutrition,
          status: form.status,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể lưu sản phẩm");
      }

      closeDrawer();
      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  }, [closeDrawer, form, loadCategories, loadProducts, reloadData, selectedProduct]);

  const deleteProduct = useCallback(async (product: ProductRow) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(product.product_id)}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể xóa sản phẩm");
      }

      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể xóa sản phẩm");
    } finally {
      setSaving(false);
    }
  }, [reloadData]);

  const toggleStatus = useCallback(async (product: ProductRow, nextStatus: ProductStatus) => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(product.product_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể cập nhật trạng thái sản phẩm");
      }

      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật trạng thái sản phẩm");
    } finally {
      setSaving(false);
    }
  }, [reloadData, saving]);

  return (
    <AdminShell
      title="Quản lý sản phẩm"
      description="Quản trị danh sách sản phẩm, danh mục, trạng thái và thông tin hiển thị trên hệ thống bán hàng."
      searchPlaceholder="Tìm kiếm sản phẩm theo tên, danh mục, đơn vị..."
      pageActions={
        <div className="flex items-center gap-2">
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
            Thêm sản phẩm
          </button>
        </div>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProductStats {...stats} />

      <ProductTable
        products={products}
        loading={loading}
        saving={saving}
        onEdit={openEditDrawer}
        onDelete={deleteProduct}
        onToggleStatus={toggleStatus}
      />

      <ProductDrawer
        open={drawerOpen}
        saving={saving}
        product={selectedProduct}
        form={form}
        categories={categories}
        onChange={patchForm}
        onClose={closeDrawer}
        onSubmit={() => {
          void submitDrawer();
        }}
      />
    </AdminShell>
  );
};

export default ProductManagement;