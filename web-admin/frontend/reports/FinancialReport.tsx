import ReportCharts from "./ReportCharts";
import ReportStats from "./ReportStats";
import AdminShell from "../shared/AdminShell";

const FinancialReport = () => {
  return (
    <AdminShell
      title="Báo cáo tài chính"
      description="Tổng hợp doanh thu, chi phí và hiệu quả theo thời gian."
      searchPlaceholder="Tìm kiếm giao dịch, báo cáo..."
    >
      <ReportStats />
      <ReportCharts />
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-900">Lịch sử giao dịch</h3>
        <p className="text-sm text-gray-500 mt-1">Đang cập nhật dữ liệu giao dịch chi tiết.</p>
      </section>
    </AdminShell>
  );
};

export default FinancialReport;