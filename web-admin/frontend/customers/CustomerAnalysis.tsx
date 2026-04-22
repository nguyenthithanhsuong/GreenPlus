import CustomerCharts from "./CustomerCharts";
import CustomerInsights from "./CustomerInsights";
import CustomerStats from "./CustomerStats";
import AdminShell from "../shared/AdminShell";

const CustomerAnalysis = () => {
  return (
    <AdminShell
      title="Phân tích khách hàng"
      description="Theo dõi hành vi mua sắm, tần suất quay lại và nhóm khách hàng mục tiêu."
      searchPlaceholder="Tìm kiếm khách hàng..."
    >
      <CustomerStats />
      <CustomerCharts />
      <CustomerInsights />
    </AdminShell>
  );
};

export default CustomerAnalysis;