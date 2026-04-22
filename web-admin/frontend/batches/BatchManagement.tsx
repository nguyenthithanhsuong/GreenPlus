import BatchStats from "./BatchStats";
import BatchTable from "./BatchTable";
import AdminShell from "../shared/AdminShell";

const BatchManagement = () => {
  return (
    <AdminShell
      title="Quản lý lô hàng"
      description="Kiểm soát các lô nhập, hạn sử dụng và truy xuất nguồn gốc."
      searchPlaceholder="Tìm kiếm lô hàng..."
    >
      <BatchStats />
      <BatchTable />
    </AdminShell>
  );
};

export default BatchManagement;