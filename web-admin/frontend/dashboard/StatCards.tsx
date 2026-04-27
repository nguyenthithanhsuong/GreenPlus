import { AlertCircle, DollarSign, Store, TrendingDown, TrendingUp, Users } from "lucide-react";
import { UserSummary } from "../../backend/modules/users/user-management.types";
import { OrderListRow } from "../../backend/modules/orders/order-tracking.types";
import { SupplierRow } from "../../backend/modules/suppliers/supplier-management.types";
import { ComplaintRow } from "../../backend/modules/community/complaint-management.types";

type StatCardsProps = {
  users: UserSummary[];
  orders: OrderListRow[];
  suppliers: SupplierRow[];
  complaints: ComplaintRow[];
  loading: boolean;
};

const toMonthKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;

const monthDiff = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const StatCards = ({ users, orders, suppliers, complaints, loading }: StatCardsProps) => {
  const now = new Date();
  const thisMonthKey = toMonthKey(now);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = toMonthKey(previousMonthDate);

  const usersByMonth = users.reduce<Record<string, number>>((accumulator, user) => {
    if (!user.created_at) {
      return accumulator;
    }

    const key = toMonthKey(new Date(user.created_at));
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const revenueByMonth = orders.reduce<Record<string, number>>((accumulator, order) => {
    const dateValue = order.order_date ?? order.created_at;
    if (!dateValue) {
      return accumulator;
    }

    const key = toMonthKey(new Date(dateValue));
    accumulator[key] = (accumulator[key] ?? 0) + Number(order.total_amount ?? 0);
    return accumulator;
  }, {});

  const userGrowth = monthDiff(usersByMonth[thisMonthKey] ?? 0, usersByMonth[previousMonthKey] ?? 0);
  const revenueGrowth = monthDiff(revenueByMonth[thisMonthKey] ?? 0, revenueByMonth[previousMonthKey] ?? 0);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const pendingSuppliers = suppliers.filter((supplier) => supplier.status === "pending").length;
  const pendingComplaints = complaints.filter((complaint) => complaint.status === "pending").length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Tổng người dùng</p>
          <div className="rounded-lg bg-blue-50 p-2">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : users.length.toLocaleString("vi-VN")}</h3>
        <p className={`flex items-center text-xs font-medium ${userGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {userGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {Math.abs(userGrowth).toFixed(1)}% <span className="ml-1 font-normal text-gray-400">so với tháng trước</span>
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Tổng doanh thu</p>
          <div className="rounded-lg bg-emerald-50 p-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : formatMoney(totalRevenue)}</h3>
        <p className={`flex items-center text-xs font-medium ${revenueGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {revenueGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {Math.abs(revenueGrowth).toFixed(1)}% <span className="ml-1 font-normal text-gray-400">so với tháng trước</span>
        </p>
      </div>

      <div className="rounded-xl border border-yellow-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Đối tác chờ duyệt</p>
          <div className="rounded-lg bg-yellow-50 p-2">
            <Store className="h-4 w-4 text-yellow-700" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : pendingSuppliers.toLocaleString("vi-VN")}</h3>
        <p className="text-xs font-medium text-yellow-600">Dữ liệu trực tiếp từ trạng thái nhà cung cấp</p>
      </div>

      <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Khiếu nại cần xử lý</p>
          <div className="rounded-lg bg-red-50 p-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : pendingComplaints.toLocaleString("vi-VN")}</h3>
        <p className="text-xs font-medium text-red-600">Tính theo complaints.status = pending</p>
      </div>
    </div>
  );
};

export default StatCards;