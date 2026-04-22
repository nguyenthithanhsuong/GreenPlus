import RoleGrid from "./RoleGrid";
import AdminShell from "../shared/AdminShell";

const RoleManagement = () => {
  return (
    <AdminShell
      title="Quản lý vai trò"
      description="Thiết lập vai trò và phạm vi truy cập cho từng nhóm người dùng."
      searchPlaceholder="Tìm kiếm vai trò..."
    >
      <RoleGrid />
    </AdminShell>
  );
};

export default RoleManagement;