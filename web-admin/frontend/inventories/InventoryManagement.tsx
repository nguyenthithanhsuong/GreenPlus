import InventoryStats from "./InventoryStats";
import InventoryTable from "./InventoryTable";
import AdminShell from "../shared/AdminShell";

const InventoryManagement = () => {
  return (
    <AdminShell
      title="Quản lý tồn kho"
      description="Cập nhật tồn kho theo lô, cảnh báo sắp hết hàng và điều phối nhập xuất."
      searchPlaceholder="Tìm kiếm tồn kho..."
    >
      <InventoryStats />
      <InventoryTable />
    </AdminShell>
  );
};

export default InventoryManagement;