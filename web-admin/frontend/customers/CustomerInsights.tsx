import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { UserSummary } from "../../backend/modules/users/user-management.types";
import { OrderListRow } from "../../backend/modules/orders/order-tracking.types";

type CustomerInsightsProps = {
  users: UserSummary[];
  orders: OrderListRow[];
  loading: boolean;
};

type TopCustomer = {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  orderCount: number;
  spent: number;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const getCustomerRank = (orderCount: number, spent: number) => {
  if (spent >= 20_000_000 || orderCount >= 30) {
    return { label: "VIP", className: "border-yellow-200 bg-yellow-50 text-yellow-700" };
  }

  if (spent >= 5_000_000 || orderCount >= 10) {
    return { label: "Loyal", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }

  return { label: "Standard", className: "border-gray-200 bg-gray-100 text-gray-600" };
};

const CustomerInsights = ({ users, orders, loading }: CustomerInsightsProps) => {
  const usersById = new Map(users.map((user) => [user.user_id, user]));
  const customerStats = new Map<string, TopCustomer>();

  for (const order of orders) {
    if (!order.user_id) {
      continue;
    }

    const user = usersById.get(order.user_id);
    const existing = customerStats.get(order.user_id);
    if (existing) {
      existing.orderCount += 1;
      existing.spent += Number(order.total_amount ?? 0);
      continue;
    }

    customerStats.set(order.user_id, {
      userId: order.user_id,
      name: user?.name ?? order.customer_name ?? "Khách ẩn danh",
      email: user?.email ?? "",
      avatar: user?.image_url ?? null,
      orderCount: 1,
      spent: Number(order.total_amount ?? 0),
    });
  }

  const topCustomers = Array.from(customerStats.values())
    .sort((left, right) => right.spent - left.spent)
    .slice(0, 6);

  const paymentBuckets = {
    cod: 0,
    momo: 0,
    vnpay: 0,
    bank_transfer: 0,
    unknown: 0,
  };

  for (const order of orders) {
    if (!order.payment_method) {
      paymentBuckets.unknown += 1;
      continue;
    }

    if (order.payment_method in paymentBuckets) {
      paymentBuckets[order.payment_method] += 1;
    }
  }

  const totalPayments = Math.max(Object.values(paymentBuckets).reduce((sum, value) => sum + value, 0), 1);
  const paymentRows = [
    { label: "COD", value: paymentBuckets.cod, barClass: "bg-emerald-600" },
    { label: "MoMo", value: paymentBuckets.momo, barClass: "bg-pink-500" },
    { label: "VNPay", value: paymentBuckets.vnpay, barClass: "bg-blue-500" },
    { label: "Chuyển khoản", value: paymentBuckets.bank_transfer, barClass: "bg-amber-500" },
    { label: "Không xác định", value: paymentBuckets.unknown, barClass: "bg-gray-400" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between border-b border-gray-50 p-5">
          <h3 className="font-bold text-gray-900">Top khách hàng (chi tiêu cao nhất)</h3>
          <Link href="/users" className="text-sm font-semibold text-emerald-600 hover:underline">Xem tất cả</Link>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-50 bg-gray-50/60 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-4 font-medium">Khách hàng</th>
                <th className="px-5 py-4 font-medium">Hạng</th>
                <th className="px-5 py-4 font-medium">Số đơn</th>
                <th className="px-5 py-4 text-right font-medium">Tổng chi tiêu</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">Đang tải khách hàng...</td>
                </tr>
              ) : topCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">Chưa có dữ liệu khách hàng có đơn.</td>
                </tr>
              ) : (
                topCustomers.map((customer) => {
                  const rank = getCustomerRank(customer.orderCount, customer.spent);

                  return (
                    <tr key={customer.userId} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {customer.avatar ? (
                            <img
                              src={customer.avatar}
                              alt={customer.name}
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                              {customer.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.email || "Không có email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold ${rank.className}`}>
                          {rank.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{customer.orderCount.toLocaleString("vi-VN")}</td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">{formatMoney(customer.spent)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 p-5">
          <h3 className="font-bold text-gray-900">Thói quen thanh toán</h3>
          <CalendarDays className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1 p-5">
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            Phân bố phương thức thanh toán từ toàn bộ đơn hàng hiện có.
          </p>

          <div className="space-y-5">
            {paymentRows.map((row) => {
              const percent = Math.round((row.value / totalPayments) * 100);
              return (
                <div key={row.label}>
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-sm font-semibold text-gray-800">{row.label}</span>
                    <span className="text-sm font-bold text-gray-700">{percent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${row.barClass}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInsights;