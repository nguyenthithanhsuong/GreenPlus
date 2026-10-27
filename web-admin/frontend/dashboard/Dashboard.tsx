"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import ActionTables from "./ActionTables";
import Charts from "./Charts";
import StatCards from "./StatCards";
import AdminShell from "../shared/AdminShell";
import PlatformDashboard from "./PlatformDashboard";
import { useAuthStore } from "@/lib/stores/authStore";
import { asPortalRole } from "@/lib/portal-access";
import { UserSummary } from "../../backend/modules/users/user-management.types";
import { OrderListRow } from "../../backend/modules/orders/order-tracking.types";
import { SupplierRow } from "../../backend/modules/suppliers/supplier-management.types";
import { ComplaintRow } from "../../backend/modules/complaints/complaint-management.types";
import { GreenCreatorPostRow } from "../../backend/modules/greencreators/greencreator-content.types";

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

const Dashboard = () => {
  const role = asPortalRole(
    useAuthStore((s) => s.user?.role_name ?? s.session?.role_name),
  );
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [greenCreatorPosts, setGreenCreatorPosts] = useState<
    GreenCreatorPostRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextUsers, nextOrders, nextSuppliers, nextComplaints, nextPosts] =
        await Promise.all([
          role === "admin" || role === "manager"
            ? fetchItems<UserSummary>("/api/users")
            : Promise.resolve([]),
          role === "manager" || role === "employee"
            ? fetchItems<OrderListRow>("/api/orders")
            : Promise.resolve([]),
          role === "manager" || role === "employee"
            ? fetchItems<SupplierRow>("/api/suppliers")
            : Promise.resolve([]),
          role === "manager" || role === "employee"
            ? fetchItems<ComplaintRow>("/api/complaints")
            : Promise.resolve([]),
          role === "admin" || role === "manager"
            ? fetchItems<GreenCreatorPostRow>("/api/greencreators")
            : Promise.resolve([]),
        ]);

      setUsers(nextUsers);
      setOrders(nextOrders);
      setSuppliers(nextSuppliers);
      setComplaints(nextComplaints);
      setGreenCreatorPosts(nextPosts);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải dữ liệu dashboard",
      );
      setUsers([]);
      setOrders([]);
      setSuppliers([]);
      setComplaints([]);
      setGreenCreatorPosts([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (role && role !== "admin") {
      void loadDashboardData();
      const id = window.setInterval(() => {
        if (document.visibilityState === "visible") void loadDashboardData();
      }, 30000);
      return () => window.clearInterval(id);
    }
  }, [loadDashboardData, role]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <AdminShell
      title={role === "admin" ? "Dashboard nền tảng" : "Tổng quan cửa hàng"}
      description="Chào mừng quay trở lại. Đây là tình hình hoạt động của GreenPlus hôm nay."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadDashboardData()}
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
      searchPlaceholder="Tìm kiếm user, nhà cung cấp..."
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {role === "admin" ? (
        <PlatformDashboard />
      ) : (
        <>
          <StatCards
            users={users}
            orders={orders}
            suppliers={suppliers}
            complaints={complaints}
            loading={loading}
          />
          <Charts orders={orders} loading={loading} />
          <ActionTables
            suppliers={suppliers}
            posts={greenCreatorPosts}
            loading={loading}
          />
        </>
      )}
    </AdminShell>
  );
};

export default Dashboard;
