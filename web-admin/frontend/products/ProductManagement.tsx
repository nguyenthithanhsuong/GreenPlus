import ProductStats from "./ProductStats";
import ProductTable from "./ProductTable";
import AdminShell from "../shared/AdminShell";

const ProductManagement = () => {
  return (
    <AdminShell
      title="Quản lý sản phẩm"
      description="Theo dõi danh sách sản phẩm đang bán, trạng thái và hiệu suất kinh doanh."
      searchPlaceholder="Tìm kiếm sản phẩm..."
    >
      <ProductStats />
      <ProductTable />
    </AdminShell>
  );
};

export default ProductManagement;