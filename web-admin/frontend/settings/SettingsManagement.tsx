import ProfileForm from "./ProfileForm";
import SettingsNav from "./SettingsNav";
import AdminShell from "../shared/AdminShell";

const SettingsManagement = () => {
  return (
    <AdminShell
      title="Cài đặt tài khoản và cửa hàng"
      description="Quản lý thông tin liên hệ, bảo mật và cấu hình nhận thông báo vận hành."
      searchPlaceholder="Tìm kiếm nhanh..."
    >
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <SettingsNav />
        <ProfileForm />
      </div>
    </AdminShell>
  );
};

export default SettingsManagement;