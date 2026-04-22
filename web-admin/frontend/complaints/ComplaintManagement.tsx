import ComplaintStats from "./ComplaintStats";
import ComplaintTable from "./ComplaintTable";
import AdminShell from "../shared/AdminShell";

const ComplaintManagement = () => {
  return (
    <AdminShell
      title="Quản lý khiếu nại"
      description="Theo dõi và xử lý các khiếu nại, đổi trả và phản hồi của khách hàng."
      searchPlaceholder="Tìm kiếm khiếu nại theo mã đơn, người gửi..."
    >
      <ComplaintStats />
      <ComplaintTable />
    </AdminShell>
  );
};

export default ComplaintManagement;
