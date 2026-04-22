import PriceStats from "./PriceStats";
import PriceTable from "./PriceTable";
import AdminShell from "../shared/AdminShell";

const PriceManagement = () => {
  return (
    <AdminShell
      title="Quản lý giá"
      description="Theo dõi biến động giá, cập nhật giá khuyến mãi và giá theo lô hàng."
      searchPlaceholder="Tìm kiếm bảng giá..."
    >
      <PriceStats />
      <PriceTable />
    </AdminShell>
  );
};

export default PriceManagement;