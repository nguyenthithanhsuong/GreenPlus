"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  compose,
  DialogFormBuilder,
  ProductManagementMapper,
  ProductManagementService,
  withErrorBoundary,
} from "@/lib";
import type { ProductFormValues } from "@/lib";
import AdminShell from "../shared/AdminShell";
import ConfirmationActionDialog from "../shared/ConfirmationActionDialog";
import ProductDrawer from "./ProductDrawer";
import ProductStats from "./ProductStats";
import ProductTable from "./ProductTable";
import type {
  CategoryRow,
  ProductRow,
  ProductStatus,
} from "../../backend/modules/catalog/product-management.types";

const BaseProductManagement = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null,
  );
  const [form, setForm] = useState<ProductFormValues>(
    ProductManagementMapper.emptyForm(),
  );
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await ProductManagementService.getProducts();
      setProducts(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải danh sách sản phẩm",
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await ProductManagementService.getCategories();
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
    const activeProducts = products.filter(
      (product) => product.status === "active",
    ).length;

    return {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts: products.length - activeProducts,
    };
  }, [products]);

  const openCreateDrawer = useCallback(() => {
    setSelectedProduct(null);
    setForm(ProductManagementMapper.emptyForm());
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((product: ProductRow) => {
    setSelectedProduct(product);
    setForm(ProductManagementMapper.toFormValues(product));
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedProduct(null);
    setForm(ProductManagementMapper.emptyForm());
  }, []);

  const patchForm = useCallback((patch: Partial<ProductFormValues>) => {
    setForm((previous) => DialogFormBuilder.patch(previous, patch));
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
      await ProductManagementService.saveProduct(
        selectedProduct?.product_id ?? null,
        ProductManagementMapper.toMutationPayload(form),
      );
      closeDrawer();
      await reloadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể lưu sản phẩm",
      );
    } finally {
      setSaving(false);
    }
  }, [closeDrawer, form, reloadData, selectedProduct]);

  const handleUploadImage = useCallback(async (file: File) => {
    setUploadingImage(true);
    setError(null);

    try {
      const data = await ProductManagementService.uploadImage(file);
      if (!data.publicUrl) {
        throw new Error("Upload ảnh sản phẩm thất bại");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.publicUrl ?? previous.imageUrl,
      }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Upload ảnh sản phẩm thất bại",
      );
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const requestDeleteProduct = useCallback((product: ProductRow) => {
    setDeleteTarget(product);
  }, []);

  const deleteProduct = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await ProductManagementService.deleteProduct(deleteTarget.product_id);
      setDeleteTarget(null);
      await reloadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể xóa sản phẩm",
      );
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, reloadData]);

  const toggleStatus = useCallback(
    async (product: ProductRow, nextStatus: ProductStatus) => {
      if (saving) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        await ProductManagementService.updateStatus(
          product.product_id,
          nextStatus,
        );
        await reloadData();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể cập nhật trạng thái sản phẩm",
        );
      } finally {
        setSaving(false);
      }
    },
    [reloadData, saving],
  );

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
        onDelete={requestDeleteProduct}
        onToggleStatus={toggleStatus}
      />

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

      <ConfirmationActionDialog
        open={Boolean(deleteTarget)}
        title="Xóa sản phẩm"
        message={`Xóa sản phẩm "${deleteTarget?.name ?? ""}"?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        confirmTone="danger"
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void deleteProduct();
        }}
      />
    </AdminShell>
  );
};

export default compose(withErrorBoundary)(BaseProductManagement);
