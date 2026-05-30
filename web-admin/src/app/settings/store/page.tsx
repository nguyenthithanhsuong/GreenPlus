import SettingsNav from "../../../../frontend/settings/SettingsNav";
import AdminShell from "../../../../frontend/shared/AdminShell";
import CurrentStoreInfo from "../../../../frontend/settings/CurrentStoreInfo";

export default function StorePage() {
  return (
    <AdminShell
      title="Cửa hàng của tôi"
      description="Xem thông tin cửa hàng đang được gán cho tài khoản hiện tại."
      searchPlaceholder="Tìm kiếm nhanh..."
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <SettingsNav />
        <CurrentStoreInfo />
      </div>
    </AdminShell>
  );
}