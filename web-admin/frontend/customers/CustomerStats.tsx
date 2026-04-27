import { CreditCard, RefreshCcw, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-react";
import { UserSummary } from "../../backend/modules/users/user-management.types";
import { OrderListRow } from "../../backend/modules/orders/order-tracking.types";

type CustomerStatsProps = {
  users: UserSummary[];
  orders: OrderListRow[];
  loading: boolean;
};

const toMonthKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;

const growthPercent = (current: number, previous: number) => {
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

const metricTrendClass = (value: number) => (value >= 0 ? "text-emerald-600" : "text-red-500");

const CustomerStats = ({ users, orders, loading }: CustomerStatsProps) => {
  const now = new Date();
  const thisMonthKey = toMonthKey(now);
  const previousMonthKey = toMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const usersByMonth = users.reduce<Record<string, number>>((accumulator, user) => {
    if (!user.created_at) {
      return accumulator;
    }

    const key = toMonthKey(new Date(user.created_at));
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const currentMonthNewUsers = usersByMonth[thisMonthKey] ?? 0;
  const previousMonthNewUsers = usersByMonth[previousMonthKey] ?? 0;
  const newUserGrowth = growthPercent(currentMonthNewUsers, previousMonthNewUsers);

  const customersOrders = new Map<string, number>();
  for (const order of orders) {
    if (!order.user_id) {
      continue;
    }

    customersOrders.set(order.user_id, (customersOrders.get(order.user_id) ?? 0) + 1);
  }

  const activeCustomers = customersOrders.size;
  let returningCustomers = 0;
  for (const orderCount of customersOrders.values()) {
    if (orderCount >= 2) {
      returningCustomers += 1;
    }
  }

  const retentionRate = activeCustomers === 0 ? 0 : (returningCustomers / activeCustomers) * 100;

  const ordersByMonth = orders.reduce<Record<string, { revenue: number; count: number }>>((accumulator, order) => {
    const dateValue = order.order_date ?? order.created_at;
    if (!dateValue) {
      return accumulator;
    }

    const key = toMonthKey(new Date(dateValue));
    if (!accumulator[key]) {
      accumulator[key] = { revenue: 0, count: 0 };
    }

    accumulator[key].count += 1;
    accumulator[key].revenue += Number(order.total_amount ?? 0);
    return accumulator;
  }, {});

  const currentMonthOrderStats = ordersByMonth[thisMonthKey] ?? { revenue: 0, count: 0 };
  const previousMonthOrderStats = ordersByMonth[previousMonthKey] ?? { revenue: 0, count: 0 };
  const currentMonthAov = currentMonthOrderStats.count === 0 ? 0 : currentMonthOrderStats.revenue / currentMonthOrderStats.count;
  const previousMonthAov = previousMonthOrderStats.count === 0 ? 0 : previousMonthOrderStats.revenue / previousMonthOrderStats.count;
  const aovGrowth = growthPercent(currentMonthAov, previousMonthAov);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Tổng khách hàng</p>
          <div className="rounded-full bg-blue-50 p-2">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : users.length.toLocaleString("vi-VN")}</h3>
        <p className={`flex items-center text-xs font-medium ${metricTrendClass(newUserGrowth)}`}>
          {newUserGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {Math.abs(newUserGrowth).toFixed(1)}% <span className="ml-1 font-normal text-gray-400">tăng trưởng người dùng mới</span>
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Khách hàng mới tháng này</p>
          <div className="rounded-full bg-emerald-50 p-2">
            <UserPlus className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : currentMonthNewUsers.toLocaleString("vi-VN")}</h3>
        <p className={`flex items-center text-xs font-medium ${metricTrendClass(newUserGrowth)}`}>
          {newUserGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {Math.abs(newUserGrowth).toFixed(1)}% <span className="ml-1 font-normal text-gray-400">so với tháng trước</span>
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Tỷ lệ quay lại</p>
          <div className="rounded-full bg-indigo-50 p-2">
            <RefreshCcw className="h-4 w-4 text-indigo-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : `${retentionRate.toFixed(1)}%`}</h3>
        <p className="text-xs font-medium text-gray-500">Khách có từ 2 đơn trở lên trên tổng khách đã mua</p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-500">Giá trị trung bình đơn (AOV)</p>
          <div className="rounded-full bg-orange-50 p-2">
            <CreditCard className="h-4 w-4 text-orange-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{loading ? "..." : formatMoney(currentMonthAov)}</h3>
        <p className={`flex items-center text-xs font-medium ${metricTrendClass(aovGrowth)}`}>
          {aovGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {Math.abs(aovGrowth).toFixed(1)}% <span className="ml-1 font-normal text-gray-400">so với tháng trước</span>
        </p>
      </div>
    </div>
  );
};

export default CustomerStats;