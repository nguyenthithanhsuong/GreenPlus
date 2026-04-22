import OrderStats from "./OrderStats";
import OrderTable from "./OrderTable";
import AdminShell from "../shared/AdminShell";

const OrderManagement = () => {
  return (
    <AdminShell
      title="Quản lý đơn hàng"
      description="Giám sát trạng thái đơn, thanh toán và tiến độ giao nhận."
      searchPlaceholder="Tìm kiếm đơn hàng theo mã, khách hàng..."
    >
      <OrderStats />
      <OrderTable />
    </AdminShell>
  );
};

export default OrderManagement;