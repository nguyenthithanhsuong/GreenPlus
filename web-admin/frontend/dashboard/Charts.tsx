import { OrderListRow } from "../../backend/modules/orders/order-tracking.types";

type ChartsProps = {
  orders: OrderListRow[];
  loading: boolean;
};

type TrendBucket = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

const monthKey = (dateValue: Date) => `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, "0")}`;

const formatCompactMoney = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B ₫`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ₫`;
  }

  return `${Math.round(value).toLocaleString("vi-VN")} ₫`;
};

const Charts = ({ orders, loading }: ChartsProps) => {
  const now = new Date();
  const lastSixMonths: TrendBucket[] = Array.from({ length: 6 }, (_, index) => {
    const dateValue = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(dateValue);

    return {
      key,
      label: dateValue.toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" }),
      revenue: 0,
      orders: 0,
    };
  });

  const trendMap = new Map(lastSixMonths.map((bucket) => [bucket.key, bucket]));

  for (const order of orders) {
    const dateInput = order.order_date ?? order.created_at;
    if (!dateInput) {
      continue;
    }

    const key = monthKey(new Date(dateInput));
    const bucket = trendMap.get(key);
    if (!bucket) {
      continue;
    }

    bucket.orders += 1;
    bucket.revenue += Number(order.total_amount ?? 0);
  }

  const maxRevenue = Math.max(...lastSixMonths.map((bucket) => bucket.revenue), 1);
  const maxOrders = Math.max(...lastSixMonths.map((bucket) => bucket.orders), 1);

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

  let vipCount = 0;
  let returningCount = 0;
  let newCount = 0;

  for (const [customerId, orderCount] of customerOrders.entries()) {
    const spend = customerSpend.get(customerId) ?? 0;
    if (spend >= vipThreshold && Number.isFinite(vipThreshold)) {
      vipCount += 1;
      continue;
    }

    if (orderCount >= 2) {
      returningCount += 1;
    } else {
      newCount += 1;
    }
  }

  const totalSegmentCustomers = Math.max(vipCount + returningCount + newCount, 1);
  const vipPercent = Math.round((vipCount / totalSegmentCustomers) * 100);
  const returningPercent = Math.round((returningCount / totalSegmentCustomers) * 100);
  const newPercent = Math.max(0, 100 - vipPercent - returningPercent);

  const donutStyle = {
    background: `conic-gradient(#059669 0% ${returningPercent}%, #60A5FA ${returningPercent}% ${returningPercent + newPercent}%, #F59E0B ${returningPercent + newPercent}% 100%)`,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Tăng trưởng doanh thu và đơn hàng (6 tháng)</h3>
          <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Dữ liệu từ orders</span>
        </div>

        <div className="grid h-64 grid-cols-6 items-end gap-3 border-b border-gray-100 pb-2">
          {lastSixMonths.map((bucket) => {
            const revenueHeight = Math.max(6, (bucket.revenue / maxRevenue) * 100);
            const orderHeight = Math.max(6, (bucket.orders / maxOrders) * 100);

            return (
              <div key={bucket.key} className="flex flex-col items-center gap-2">
                <div className="flex h-52 w-full items-end justify-center gap-1">
                  <div className="w-3 rounded-t bg-emerald-500/90" style={{ height: `${revenueHeight}%` }} title={formatCompactMoney(bucket.revenue)} />
                  <div className="w-3 rounded-t bg-blue-400/90" style={{ height: `${orderHeight}%` }} title={`${bucket.orders} đơn`} />
                </div>
                <p className="text-[11px] text-gray-500">{bucket.label}</p>
              </div>
            );
          })}
        </div>

        {loading ? <p className="mt-3 text-xs text-gray-400">Đang tải dữ liệu biểu đồ...</p> : null}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-6 font-bold text-gray-900">Phân khúc khách hàng</h3>
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-6 h-40 w-40 rounded-full" style={donutStyle}>
            <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-white text-center">
              <div>
                <p className="text-xl font-bold text-gray-900">{totalSegmentCustomers.toLocaleString("vi-VN")}</p>
                <p className="text-xs text-gray-500">khách có đơn</p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-gray-600">Khách hàng cũ ({">="}2 đơn)</span>
              </div>
              <span className="font-medium">{returningPercent}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-gray-600">Khách hàng mới (1 đơn)</span>
              </div>
              <span className="font-medium">{newPercent}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-gray-600">Khách VIP (top 10% chi tiêu)</span>
              </div>
              <span className="font-medium">{vipPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;