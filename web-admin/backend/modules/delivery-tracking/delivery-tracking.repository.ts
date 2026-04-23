import { createServiceRoleSupabaseClient } from "../../core/supabase";
import {
  DeliveryStatus,
  DeliveryTrackingDetailRow,
  DeliveryTrackingHistoryRow,
  DeliveryTrackingRow,
} from "./delivery-tracking.types";

type DeliveryTrackingDbRow = {
  tracking_id: string;
  order_id: string | null;
  status: string;
  note: string | null;
  created_at: string | null;
  orders?: {
    order_id?: string | null;
    order_date?: string | null;
    total_amount?: number | string | null;
    delivery_address?: string | null;
    users?: {
      name?: string | null;
      phone?: string | null;
    } | null;
  } | null;
};

export class DeliveryTrackingRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listTrackingRows(): Promise<DeliveryTrackingRow[]> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("order_id,status,note,created_at,orders(order_id,order_date,total_amount,delivery_address,users(name,phone))")
      .order("created_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return this.toLatestRows((data ?? []) as DeliveryTrackingDbRow[]);
  }

  async listTrackingHistoryByOrderId(orderId: string): Promise<DeliveryTrackingHistoryRow[]> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("order_id,status,note,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DeliveryTrackingDbRow[]).map((row) => this.toHistoryRow(row));
  }

  async createTrackingEntry(input: {
    orderId: string;
    status: DeliveryStatus;
    note?: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("orders")
      .insert({
        order_id: input.orderId,
        status: input.status,
        note: input.note?.trim() || null,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  private toLatestRows(rows: DeliveryTrackingDbRow[]): DeliveryTrackingRow[] {
    const grouped = new Map<string, { row: DeliveryTrackingDbRow; count: number }>();

    for (const row of rows) {
      const orderId = row.order_id ?? row.orders?.order_id ?? null;
      if (!orderId) {
        continue;
      }

      const existing = grouped.get(orderId);
      const count = (existing?.count ?? 0) + 1;

      if (!existing) {
        grouped.set(orderId, { row, count });
        continue;
      }

      const currentCreatedAt = existing.row.created_at ? new Date(existing.row.created_at).getTime() : 0;
      const nextCreatedAt = row.created_at ? new Date(row.created_at).getTime() : 0;

      if (nextCreatedAt >= currentCreatedAt) {
        grouped.set(orderId, { row, count });
      } else {
        grouped.set(orderId, { row: existing.row, count });
      }
    }

    return Array.from(grouped.values()).map(({ row, count }) => this.toLatestRow(row, count));
  }

  private toLatestRow(row: DeliveryTrackingDbRow, trackingCount: number): DeliveryTrackingRow {
    const normalizedStatus = this.normalizeStatus(row.status);

    return {
      order_id: row.order_id ?? row.orders?.order_id ?? "",
      customer_name: row.orders?.users?.name ?? null,
      customer_phone: row.orders?.users?.phone ?? null,
      order_date: row.orders?.order_date ?? null,
      delivery_address: row.orders?.delivery_address ?? "",
      total_amount: Number(row.orders?.total_amount ?? 0),
      latest_status: normalizedStatus,
      latest_note: row.note,
      latest_tracking_at: row.created_at,
      tracking_count: trackingCount,
    };
  }

  private toHistoryRow(row: DeliveryTrackingDbRow): DeliveryTrackingHistoryRow {
    return {
      tracking_id: row.tracking_id,
      order_id: row.order_id,
      status: this.normalizeStatus(row.status),
      note: row.note,
      created_at: row.created_at,
    };
  }

  private normalizeStatus(value: string): DeliveryStatus {
    if (
      value === "pending" ||
      value === "assigned" ||
      value === "picked_up" ||
      value === "delivering" ||
      value === "delivered" ||
      value === "failed" ||
      value === "cancelled"
    ) {
      return value;
    }

    return "pending";
  }
}