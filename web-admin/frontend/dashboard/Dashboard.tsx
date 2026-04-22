import { Calendar } from "lucide-react";
import ActionTables from "./ActionTables";
import Charts from "./Charts";
import StatCards from "./StatCards";
import AdminShell from "../shared/AdminShell";

const Dashboard = () => {
  return (
    <AdminShell
      title="Tổng quan hệ thống"
      description="Chào mừng quay trở lại. Đây là tình hình hoạt động của GreenPlus hôm nay."
      pageActions={
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>19 Thang 3, 2026</span>
        </div>
      }
      searchPlaceholder="Tìm kiếm user, nhà cung cấp..."
    >
      <StatCards />
      <Charts />
      <ActionTables />
    </AdminShell>
  );
};

export default Dashboard;