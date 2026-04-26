"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import ShipperStats from "./ShipperStats";
import ShipperTable from "./ShipperTable";
import ShipperDrawer, { ShipperFormValues } from "./ShipperDrawer";
import type {
  DeliveryShipperOption,
  DeliveryStatus,
  DeliveryTrackingDetailRow,
  DeliveryTrackingRow,
} from "../../backend/modules/delivery-tracking/delivery-tracking.types";
import { deliveryTrackingSearchStrategy } from "../shared/searchStrategies";

type StatusFilter = "all" | DeliveryStatus;

const emptyForm = (): ShipperFormValues => ({
  employeeId: "",
  status: "assigned",
  note: "",
});

const ShipperManagement = () => {
  const searchParams = useSearchParams();
  const autoOpenedOrderIdRef = useRef<string | null>(null);
  const [items, setItems] = useState<DeliveryTrackingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [shippers, setShippers] = useState<DeliveryShipperOption[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<DeliveryTrackingDetailRow | null>(null);
  const [form, setForm] = useState<ShipperFormValues>(emptyForm());

  const loadShippers = useCallback(async () => {
    try {
      const response = await fetch("/api/deliveries/shippers", { cache: "no-store" });
      const data = (await response.json()) as { items?: DeliveryShipperOption[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách shipper");
      }

      setShippers(Array.isArray(data.items) ? data.items : []);
    } catch {
      setShippers([]);
    }
  }, []);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const response = await fetch(`/api/deliveries${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" });
      const data = (await response.json()) as { items?: DeliveryTrackingRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải dữ liệu giao hàng");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu giao hàng");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  useEffect(() => {
    void loadShippers();
  }, [loadShippers]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") {
      return items;
    }

    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const filteredItems = useMemo(() => deliveryTrackingSearchStrategy.filter(filteredByStatus, searchQuery), [filteredByStatus, searchQuery]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: items.length,
      assigned: 0,
      picked_up: 0,
      delivering: 0,
      delivered: 0,
    };

    items.forEach((item) => {
      if (result[item.status] !== undefined) {
        result[item.status] += 1;
      }
    });

    return result;
  }, [items]);

  const stats = useMemo(() => ({
    totalDeliveries: items.length,
    inProgressCount: items.filter((item) => ["assigned", "picked_up", "delivering"].includes(item.status)).length,
    deliveredCount: items.filter((item) => item.status === "delivered").length,
  }), [items]);

  const openDetail = useCallback(async (orderId: string) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDrawerError(null);

    try {
      const response = await fetch(`/api/deliveries/${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const data = (await response.json()) as DeliveryTrackingDetailRow & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải chi tiết giao hàng");
      }

      setSelectedDetail(data);
      setForm({
        employeeId: data.employee_id ?? "",
        status: data.status,
        note: "",
      });
    } catch (requestError) {
      setDrawerError(requestError instanceof Error ? requestError.message : "Không thể tải chi tiết giao hàng");
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const orderId = searchParams.get("orderId")?.trim();

    if (!orderId || loading || autoOpenedOrderIdRef.current === orderId) {
      return;
    }

    autoOpenedOrderIdRef.current = orderId;
    void openDetail(orderId);
  }, [loading, openDetail, searchParams]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedDetail(null);
    setDrawerError(null);
    setForm(emptyForm());
  }, []);

  const submitStatus = useCallback(async () => {
    if (!selectedDetail) {
      setDrawerError("Không tìm thấy đơn giao hàng cần cập nhật");
      return;
    }

    setSaving(true);
    setError(null);
    setDrawerError(null);

    try {
      if (!form.employeeId) {
        throw new Error("Vui lòng chọn shipper phụ trách");
      }

      const response = await fetch(`/api/deliveries/${encodeURIComponent(selectedDetail.order_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          status: form.status,
          note: form.note,
        }),
      });

      const data = (await response.json()) as DeliveryTrackingDetailRow & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Không thể cập nhật trạng thái giao hàng");
      }

      setSelectedDetail(data);
      await loadDeliveries();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Không thể cập nhật trạng thái giao hàng";
      setError(message);
      setDrawerError(message);
    } finally {
      setSaving(false);
    }
  }, [form.employeeId, form.note, form.status, loadDeliveries, selectedDetail]);

  return (
    <AdminShell
      title="Theo dõi giao hàng"
      description="Lọc đơn theo trạng thái/ngày, xem lịch sử giao hàng và cập nhật tiến độ trực tiếp từ bảng điều phối."
      pageActions={
        <button
          type="button"
          onClick={() => void loadDeliveries()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          disabled={loading || saving}
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      }
    >
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <ShipperStats {...stats} />
      <ShipperTable
        items={filteredItems}
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
      />

      <ShipperDrawer
        isOpen={drawerOpen}
        loading={detailLoading}
        saving={saving}
        error={drawerError}
        detail={selectedDetail}
        shippers={shippers}
        form={form}
        onClose={closeDrawer}
        onSubmit={() => {
          void submitStatus();
        }}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
    </AdminShell>
  );
};

export default ShipperManagement;