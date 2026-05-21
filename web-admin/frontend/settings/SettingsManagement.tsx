import ProfileForm from "./ProfileForm";
import SettingsNav from "./SettingsNav";
import AdminShell from "../shared/AdminShell";
import UserDebugPanel from "./UserDebugPanel";

const SettingsManagement = () => {
  return (
    <AdminShell
      title="Cài đặt tài khoản"
      description="Quản lý hồ sơ cá nhân, bảo mật và thông báo tài khoản."
      searchPlaceholder="Tìm kiếm nhanh..."
    >
      <UserDebugPanel />
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <SettingsNav />
        <ProfileForm />
      </div>
    </AdminShell>
  );
};

export default SettingsManagement;