"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { usePermissions } from "@/lib/usePermissions";
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
  const { hasPermission, loading: permLoading } = usePermissions();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

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

  const handleUploadImage = useCallback(async (file: File) => {
    setUploadingImage(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/products/image", {
        method: "POST",
        body,
      });

      const data = (await response.json()) as { publicUrl?: string; error?: string };
      if (!response.ok || !data.publicUrl) {
        throw new Error(data.error ?? "Upload ảnh sản phẩm thất bại");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.publicUrl ?? previous.imageUrl,
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Upload ảnh sản phẩm thất bại");
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const requestDeleteProduct = useCallback((product: ProductRow) => {
    setDeleteTarget(product);
    setDeleteAcknowledged(false);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (deletingProductId) {
      return;
    }

    setDeleteTarget(null);
    setDeleteAcknowledged(false);
  }, [deletingProductId]);

  const deleteProduct = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletingProductId(deleteTarget.product_id);
    setError(null);

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(deleteTarget.product_id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ force: true }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể xóa sản phẩm");
      }

      setDeleteTarget(null);
      setDeleteAcknowledged(false);
      await reloadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể xóa sản phẩm");
    } finally {
      setDeletingProductId(null);
    }
  }, [deleteTarget, reloadData]);

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
          {!permLoading && hasPermission("products.create") && (
  <button
    type="button"
    onClick={openCreateDrawer}
    className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#047857] disabled:opacity-60"
    disabled={loading || saving}
  >
    <Plus className="h-4 w-4" />
    Thêm sản phẩm
  </button>
)}
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
        saving={saving || deletingProductId !== null}
        onEdit={openEditDrawer}
        onDelete={requestDeleteProduct}
        onToggleStatus={toggleStatus}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Xóa vĩnh viễn sản phẩm</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {deleteTarget.name} sẽ bị xóa cùng toàn bộ dữ liệu liên quan. Hành động này ảnh hưởng đến các row trong
                    batches, inventory, inventory_transactions, prices, cart_items, order_items, subscriptions,
                    group_buys, group_buy_members và reviews theo ràng buộc cascade/restrict của DB.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                disabled={deletingProductId !== null}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={deleteAcknowledged}
                  onChange={(event) => setDeleteAcknowledged(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  disabled={deletingProductId !== null}
                />
                <span className="text-sm leading-6 text-red-700">
                  Tôi hiểu đây là thao tác không thể hoàn tác và sẽ xóa các dữ liệu liên quan.
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  disabled={deletingProductId !== null}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void deleteProduct()}
                  disabled={!deleteAcknowledged || deletingProductId !== null}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingProductId ? "Đang xóa..." : "Xóa vĩnh viễn"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ProductDrawer
        open={drawerOpen}
        saving={saving}
        uploadingImage={uploadingImage}
        product={selectedProduct}
        form={form}
        categories={categories}
        onChange={patchForm}
        onUploadImage={handleUploadImage}
        onClose={closeDrawer}
        onSubmit={() => {
          void submitDrawer();
        }}
      />
    </AdminShell>
  );
};

export default ProductManagement;