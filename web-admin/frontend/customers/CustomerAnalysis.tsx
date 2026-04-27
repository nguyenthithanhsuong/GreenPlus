"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import CustomerCharts from "./CustomerCharts";
import CustomerInsights from "./CustomerInsights";
import CustomerStats from "./CustomerStats";
import AdminShell from "../shared/AdminShell";
import { UserSummary } from "../../backend/modules/users/user-management.types";
import { OrderListRow } from "../../backend/modules/orders/order-tracking.types";

type ApiItemsResponse<T> = {
  items?: T[];
  error?: string;
};

const fetchItems = async <T,>(url: string): Promise<T[]> => {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as ApiItemsResponse<T>;
  if (!response.ok) {
    throw new Error(data.error ?? `Không thể tải dữ liệu từ ${url}`);
  }

  return Array.isArray(data.items) ? data.items : [];
};

const CustomerAnalysis = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextUsers, nextOrders] = await Promise.all([
        fetchItems<UserSummary>("/api/users"),
        fetchItems<OrderListRow>("/api/orders"),
      ]);

      setUsers(nextUsers);
      setOrders(nextOrders);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu khách hàng");
      setUsers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()),
    [],
  );

  return (
    <AdminShell
      title="Phân tích khách hàng"
      description="Theo dõi hành vi mua sắm, tần suất quay lại và nhóm khách hàng mục tiêu."
      searchPlaceholder="Tìm kiếm khách hàng..."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
            <Calendar className="h-4 w-4" />
            <span>{todayLabel}</span>
          </div>
        </div>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <CustomerStats users={users} orders={orders} loading={loading} />
      <CustomerCharts users={users} orders={orders} loading={loading} />
      <CustomerInsights users={users} orders={orders} loading={loading} />
    </AdminShell>
  );
};

export default CustomerAnalysis;