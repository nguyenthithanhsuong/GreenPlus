import { MoreHorizontal } from "lucide-react";
import { UserSummary } from "../../backend/modules/users/user-management.types";
import { OrderListRow } from "../../backend/modules/orders/order-tracking.types";

type CustomerChartsProps = {
  users: UserSummary[];
  orders: OrderListRow[];
  loading: boolean;
};

type MonthBucket = {
  key: string;
  label: string;
  newUsers: number;
  activeBuyers: number;
};

const monthKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;

const CustomerCharts = ({ users, orders, loading }: CustomerChartsProps) => {
  const now = new Date();
  const buckets: MonthBucket[] = Array.from({ length: 12 }, (_, index) => {
    const dateValue = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      key: monthKey(dateValue),
      label: `T${dateValue.getMonth() + 1}`,
      newUsers: 0,
      activeBuyers: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const user of users) {
    if (!user.created_at) {
      continue;
    }

    const bucket = bucketMap.get(monthKey(new Date(user.created_at)));
    if (!bucket) {
      continue;
    }

    bucket.newUsers += 1;
  }

  const activeBuyerByMonth = new Map<string, Set<string>>();
  for (const order of orders) {
    const dateValue = order.order_date ?? order.created_at;
    if (!dateValue || !order.user_id) {
      continue;
    }

    const key = monthKey(new Date(dateValue));
    if (!activeBuyerByMonth.has(key)) {
      activeBuyerByMonth.set(key, new Set());
    }

    activeBuyerByMonth.get(key)?.add(order.user_id);
  }

  for (const bucket of buckets) {
    bucket.activeBuyers = activeBuyerByMonth.get(bucket.key)?.size ?? 0;
  }

  const maxValue = Math.max(
    ...buckets.flatMap((bucket) => [bucket.newUsers, bucket.activeBuyers]),
    1,
  );

  const customerSpend = new Map<string, number>();
  const customerOrders = new Map<string, number>();
  for (const order of orders) {
    if (!order.user_id) {
      continue;
    }

    customerSpend.set(order.user_id, (customerSpend.get(order.user_id) ?? 0) + Number(order.total_amount ?? 0));
    customerOrders.set(order.user_id, (customerOrders.get(order.user_id) ?? 0) + 1);
  }

  const spendValues = Array.from(customerSpend.values()).sort((left, right) => left - right);
  const vipThreshold = spendValues.length > 0 ? spendValues[Math.floor(spendValues.length * 0.9)] : Number.POSITIVE_INFINITY;

  let frequentCount = 0;
  let vipCount = 0;
  let oneTimeCount = 0;

  for (const [customerId, orderCount] of customerOrders.entries()) {
    const spend = customerSpend.get(customerId) ?? 0;
    if (spend >= vipThreshold && Number.isFinite(vipThreshold)) {
      vipCount += 1;
      continue;
    }

    if (orderCount >= 2) {
      frequentCount += 1;
    } else {
      oneTimeCount += 1;
    }
  }

  const totalSegment = Math.max(frequentCount + vipCount + oneTimeCount, 1);
  const frequentPercent = Math.round((frequentCount / totalSegment) * 100);
  const vipPercent = Math.round((vipCount / totalSegment) * 100);
  const oneTimePercent = Math.max(0, 100 - frequentPercent - vipPercent);

  const donutStyle = {
    background: `conic-gradient(#10B981 0% ${frequentPercent}%, #F59E0B ${frequentPercent}% ${frequentPercent + vipPercent}%, #E5E7EB ${frequentPercent + vipPercent}% 100%)`,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Tăng trưởng khách hàng (12 tháng)</h3>
          <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="chart options">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-[250px] flex-1 grid-cols-12 items-end gap-2">
          {buckets.map((bucket) => {
            const newUserHeight = Math.max(6, (bucket.newUsers / maxValue) * 100);
            const activeBuyerHeight = Math.max(6, (bucket.activeBuyers / maxValue) * 100);

            return (
              <div key={bucket.key} className="flex flex-col items-center gap-2">
                <div className="flex h-52 w-full items-end justify-center gap-1">
                  <div
                    className="w-2 rounded-t bg-emerald-500"
                    style={{ height: `${newUserHeight}%` }}
                    title={`Khách mới: ${bucket.newUsers}`}
                  />
                  <div
                    className="w-2 rounded-t bg-blue-400"
                    style={{ height: `${activeBuyerHeight}%` }}
                    title={`Khách phát sinh đơn: ${bucket.activeBuyers}`}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{bucket.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Khách mới
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            Khách phát sinh đơn
          </div>
          {loading ? <span>Đang tải dữ liệu...</span> : null}
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Phân khúc khách hàng</h3>
          <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="segment options">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative mb-8 h-44 w-44 rounded-full" style={donutStyle}>
            <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white">
              <span className="text-2xl font-bold text-gray-900">{totalSegment.toLocaleString("vi-VN")}</span>
              <span className="text-xs text-gray-500">khách có đơn</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-600">Khách thường xuyên</span>
              </div>
              <span className="font-bold text-gray-900">{frequentPercent}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="text-gray-600">Khách VIP (top 10% chi tiêu)</span>
              </div>
              <span className="font-bold text-gray-900">{vipPercent}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 rounded-full bg-gray-300" />
                <span className="text-gray-600">Khách một lần</span>
              </div>
              <span className="font-bold text-gray-900">{oneTimePercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCharts;