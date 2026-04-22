import UserStats from "./UserStats";
import UserTable from "./UserTable";
import AdminShell from "../shared/AdminShell";

const UserManagement = () => {
  return (
    <AdminShell
      title="Quản lý người dùng"
      description="Quản trị danh sách tài khoản, phân quyền và trạng thái hoạt động trên hệ thống."
      searchPlaceholder="Tìm kiếm người dùng bằng tên, email..."
    >
      <UserStats />
      <UserTable />
    </AdminShell>
  );
};

export default UserManagement;