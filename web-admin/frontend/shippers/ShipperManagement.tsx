import ShipperStats from "./ShipperStats";
import ShipperTable from "./ShipperTable";
import AdminShell from "../shared/AdminShell";

const ShipperManagement = () => {
  return (
    <AdminShell
      title="Quản lý shipper"
      description="Danh sách tài xế giao hàng, trạng thái hoạt động và hiệu suất giao nhận."
      searchPlaceholder="Tìm kiếm shipper..."
    >
      <ShipperStats />
      <ShipperTable />
    </AdminShell>
  );
};

export default ShipperManagement;