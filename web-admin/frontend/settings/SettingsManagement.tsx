import ProfileForm from "./ProfileForm";
import SettingsNav from "./SettingsNav";
import AdminShell from "../shared/AdminShell";

const SettingsManagement = () => {
  return (
    <AdminShell
      title="Cài đặt tài khoản"
      description="Quản lý hồ sơ cá nhân, bảo mật và thông báo tài khoản."
      searchPlaceholder="Tìm kiếm nhanh..."
    >
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <ProfileForm />
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><SettingsNav /></div>
      </div>
    </AdminShell>
  );
};

export default SettingsManagement;
