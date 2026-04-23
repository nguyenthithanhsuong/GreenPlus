"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import OrderStats from "./OrderStats";
import OrderTable from "./OrderTable";
import OrderDetailPanel from "./OrderDetailPanel";
import type {
  OrderDetailRow,
  OrderListRow,
  OrderStatus,
} from "../../backend/modules/orders/order-tracking.types";
import { orderSearchStrategy } from "../shared/searchStrategies";

type StatusFilter = "all" | OrderStatus;

const toIsoDate = (date: Date): string => {
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
};

const OrderManagement = () => {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailRow | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fromDate) {
        params.set("fromDate", fromDate);
      }
      if (toDate) {
        params.set("toDate", toDate);
      }

      const query = params.toString();
      const response = await fetch(`/api/orders${query ? `?${query}` : ""}`, { cache: "no-store" });
      const data = (await response.json()) as { items?: OrderListRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách đơn hàng");
      }

      setOrders(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const statusFilteredOrders = useMemo(() => {
    if (statusFilter === "all") {
      return orders;
    }

    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const filteredOrders = useMemo(() => {
    return orderSearchStrategy.filter(statusFilteredOrders, searchQuery);
  }, [searchQuery, statusFilteredOrders]);

  const counts = useMemo(() => {
    const countByStatus = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      delivering: 0,
      completed: 0,
      cancelled: 0,
    } as Record<StatusFilter, number>;

    orders.forEach((order) => {
      countByStatus[order.status] += 1;
    });

    return countByStatus;
  }, [orders]);

  const stats = useMemo(() => {
    const today = toIsoDate(new Date());
    return {
      totalToday: orders.filter((order) => (order.order_date ?? "").slice(0, 10) === today).length,
      pendingCount: counts.pending,
      preparingCount: counts.preparing,
      deliveringCount: counts.delivering,
      completedCount: counts.completed,
    };
  }, [counts, orders]);

  const openDetail = useCallback(async (orderId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const data = (await response.json()) as OrderDetailRow & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải chi tiết đơn hàng");
      }

      setSelectedOrder(data);
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : "Không thể tải chi tiết đơn hàng");
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailError(null);
    setSelectedOrder(null);
  }, []);

  const updateStatus = useCallback(async (orderId: string, status: OrderStatus, note?: string) => {
    setSaving(true);
    setError(null);
    setDetailError(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });

      const data = (await response.json()) as OrderDetailRow & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Không thể cập nhật trạng thái đơn hàng");
      }

      setSelectedOrder(data);
      await loadOrders();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Không thể cập nhật trạng thái đơn hàng";
      setError(message);
      setDetailError(message);
    } finally {
      setSaving(false);
    }
  }, [loadOrders]);

  return (
    <AdminShell
      title="Quản lý đơn hàng"
      description="Giám sát trạng thái đơn, thanh toán và tiến độ giao nhận."
      pageActions={
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          disabled={loading || saving}
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <OrderStats {...stats} />
      <OrderTable
        items={filteredOrders}
        loading={loading}
        saving={saving}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        fromDate={fromDate}
        toDate={toDate}
        counts={counts}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onOpenDetail={(orderId) => {
          void openDetail(orderId);
        }}
        onQuickConfirm={(orderId) => {
          void updateStatus(orderId, "confirmed", "Xác nhận nhanh từ bảng đơn hàng");
        }}
      />

      <OrderDetailPanel
        isOpen={detailOpen}
        loading={detailLoading}
        saving={saving}
        error={detailError}
        order={selectedOrder}
        onClose={closeDetail}
        onUpdateStatus={(status, note) => {
          if (!selectedOrder) {
            return;
          }

          void updateStatus(selectedOrder.order_id, status, note);
        }}
      />
    </AdminShell>
  );
};

export default OrderManagement;