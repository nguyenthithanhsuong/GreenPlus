import SupplierStats from "./SupplierStats";
import SupplierTable from "./SupplierTable";
import AdminShell from "../shared/AdminShell";

const SupplierManagement = () => {
  return (
    <AdminShell
      title="Quản lý nhà cung cấp"
      description="Danh sách đối tác, nông trại phân phối thực phẩm sạch trên hệ thống."
      searchPlaceholder="Tìm kiếm nhà cung cấp bằng tên, email..."
    >
      <SupplierStats />
      <SupplierTable />
    </AdminShell>
  );
};

export default SupplierManagement;