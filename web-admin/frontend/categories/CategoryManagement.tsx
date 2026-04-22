import CategoryStats from "./CategoryStats";
import CategoryTable from "./CategoryTable";
import AdminShell from "../shared/AdminShell";

const CategoryManagement = () => {
  return (
    <AdminShell
      title="Quản lý danh mục"
      description="Tổ chức danh mục sản phẩm và điều hướng hiển thị trên hệ thống bán hàng."
      searchPlaceholder="Tìm kiếm danh mục..."
    >
      <CategoryStats />
      <CategoryTable />
    </AdminShell>
  );
};

export default CategoryManagement;