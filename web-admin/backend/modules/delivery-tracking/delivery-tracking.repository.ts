import { createServiceRoleSupabaseClient } from "../../core/supabase";
import {
  DeliveryShipperOption,
  DeliveryStatus,
  DeliveryTrackingFilterInput,
  DeliveryTrackingRow,
} from "./delivery-tracking.types";

type DeliveryDbRow = {
  delivery_id: string;
  order_id: string | null;
  employee_id: string | null;
  status: string | null;
  pickup_time: string | null;
  delivery_time: string | null;
  note: string | null;
  orders?: {
    order_date?: string | null;
    total_amount?: number | string | null;
    delivery_address?: string | null;
    users?: {
      name?: string | null;
      phone?: string | null;
    } | null;
  } | null;
  users?: {
    name?: string | null;
    phone?: string | null;
  } | null;
};

type ShipperDbRow = {
  user_id: string;
  name: string;
  phone: string | null;
  status: string | null;
  roles?: {
    role_name?: string | null;
    is_shipper?: boolean | null;
  } | null;
};

export class DeliveryTrackingRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listDeliveries(filters: DeliveryTrackingFilterInput = {}): Promise<DeliveryTrackingRow[]> {
    const { data, error } = await this.supabase
      .from("deliveries")
      .select(
        "delivery_id,order_id,employee_id,status,pickup_time,delivery_time,note,orders(order_date,total_amount,delivery_address,users(name,phone)),users(name,phone)",
      );

    if (error) {
      throw new Error(error.message);
    }

    const rows = ((data ?? []) as DeliveryDbRow[]).map((row) => this.toDeliveryTrackingRow(row));

    return rows
      .filter((row) => (filters.status ? row.status === filters.status : true))
      .filter((row) => (filters.employeeId ? row.employee_id === filters.employeeId : true))
      .filter((row) => this.matchesDateRange(row, filters.fromDate, filters.toDate))
      .sort((left, right) => this.toSortTimestamp(right) - this.toSortTimestamp(left));
  }

  async getDeliveryByOrderId(orderId: string): Promise<DeliveryTrackingRow | null> {
    const { data, error } = await this.supabase
      .from("deliveries")
      .select(
        "delivery_id,order_id,employee_id,status,pickup_time,delivery_time,note,orders(order_date,total_amount,delivery_address,users(name,phone)),users(name,phone)",
      )
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toDeliveryTrackingRow(data as DeliveryDbRow) : null;
  }

  async createDelivery(input: {
    orderId: string;
    employeeId: string;
    status?: DeliveryStatus;
    note?: string;
  }): Promise<void> {
    const { error } = await this.supabase.from("deliveries").insert({
      order_id: input.orderId,
      employee_id: input.employeeId,
      status: input.status ?? "assigned",
      note: input.note?.trim() || null,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateDeliveryAssignment(input: {
    orderId: string;
    employeeId: string;
    note?: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("deliveries")
      .update({
        employee_id: input.employeeId,
        note: input.note?.trim() || null,
      })
      .eq("order_id", input.orderId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateDeliveryStatus(input: {
    deliveryId: string;
    status: DeliveryStatus;
    employeeId?: string;
    note?: string;
  }): Promise<void> {
    const updateData: Partial<DeliveryDbRow> = {
      status: input.status,
      note: input.note?.trim() || null,
    };

    if (input.employeeId) {
      updateData.employee_id = input.employeeId;
    }

    // handle timestamps based on status
    if (input.status === "picked_up") {
      updateData.pickup_time = new Date().toISOString();
    }

    if (input.status === "delivered") {
      updateData.delivery_time = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from("deliveries")
      .update(updateData)
      .eq("delivery_id", input.deliveryId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async listShippers(): Promise<DeliveryShipperOption[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("user_id,name,phone,status,roles!inner(role_name,is_shipper)")
      .eq("roles.is_shipper", true)
      .neq("status", "banned")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ShipperDbRow[]).map((row) => ({
      user_id: row.user_id,
      name: row.name,
      phone: row.phone,
      role_name: row.roles?.role_name ?? null,
      status: row.status,
    }));
  }

  async findShipperById(employeeId: string): Promise<DeliveryShipperOption | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("user_id,name,phone,status,roles!inner(role_name,is_shipper)")
      .eq("user_id", employeeId)
      .eq("roles.is_shipper", true)
      .neq("status", "banned")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    const row = data as ShipperDbRow;
    return {
      user_id: row.user_id,
      name: row.name,
      phone: row.phone,
      role_name: row.roles?.role_name ?? null,
      status: row.status,
    };
  }

  private normalizeStatus(value: string | null): DeliveryStatus {
    if (
      value === "assigned" ||
      value === "picked_up" ||
      value === "delivering" ||
      value === "delivered"
    ) {
      return value;
    }

    return "assigned";
  }

  private toDeliveryTrackingRow(row: DeliveryDbRow): DeliveryTrackingRow {
    const order = row.orders ?? null;
    const customer = order?.users ?? null;
    const shipper = row.users ?? null;

    return {
      delivery_id: row.delivery_id,
      order_id: row.order_id ?? "",
      employee_id: row.employee_id,
      shipper_name: shipper?.name ?? null,
      shipper_phone: shipper?.phone ?? null,
      customer_name: customer?.name ?? null,
      customer_phone: customer?.phone ?? null,
      order_date: order?.order_date ?? null,
      delivery_address: order?.delivery_address ?? "",
      total_amount: Number(order?.total_amount ?? 0),
      status: this.normalizeStatus(row.status),
      note: row.note,
      pickup_time: row.pickup_time,
      delivery_time: row.delivery_time,
    };
  }

  private matchesDateRange(row: DeliveryTrackingRow, fromDate?: string, toDate?: string): boolean {
    const source = row.order_date ?? row.pickup_time ?? row.delivery_time;
    if (!source) {
      return !fromDate && !toDate;
    }

    const timestamp = Date.parse(source);
    if (Number.isNaN(timestamp)) {
      return true;
    }

    if (fromDate && timestamp < Date.parse(`${fromDate}T00:00:00.000Z`)) {
      return false;
    }

    if (toDate && timestamp > Date.parse(`${toDate}T23:59:59.999Z`)) {
      return false;
    }

    return true;
  }

  private toSortTimestamp(row: DeliveryTrackingRow): number {
    const source = row.pickup_time ?? row.delivery_time ?? row.order_date;
    if (!source) {
      return 0;
    }

    const timestamp = Date.parse(source);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}