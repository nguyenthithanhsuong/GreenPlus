import type { DeliveryTrackingRow } from "../../backend/modules/delivery-tracking/delivery-tracking.types";
import type { OrderListRow } from "../../backend/modules/orders/order-tracking.types";
import type { RoleSummary } from "../../backend/modules/roles/role-management.types";

export interface SearchStrategy<T> {
  filter(items: T[], query: string): T[];
  matches(item: T, query: string): boolean;
}

export const normalizeSearchText = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

abstract class BaseSearchStrategy<T> implements SearchStrategy<T> {
  filter(items: T[], query: string): T[] {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => this.matches(item, normalizedQuery));
  }

  matches(item: T, query: string): boolean {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = this.getSearchableText(item)
      .map((value) => normalizeSearchText(String(value ?? "")))
      .filter(Boolean)
      .join(" ");

    return searchableText.includes(normalizedQuery);
  }

  protected abstract getSearchableText(item: T): Array<string | number | null | undefined>;
}

class UserSearchStrategy extends BaseSearchStrategy<{
  user_id: string;
  role_id: string | null;
  name: string;
  email: string;
  role_name: string | null;
  phone: string | null;
  address: string | null;
  status: "active" | "inactive" | "banned";
  created_at: string;
  image_url: string | null;
}> {
  protected getSearchableText(item: {
    user_id: string;
    role_id: string | null;
    name: string;
    email: string;
    role_name: string | null;
    phone: string | null;
    address: string | null;
    status: "active" | "inactive" | "banned";
    created_at: string;
    image_url: string | null;
  }): Array<string | number | null | undefined> {
    return [
      item.user_id,
      item.name,
      item.email,
      item.role_name,
      item.phone,
      item.address,
      item.status,
      item.created_at,
    ];
  }
}

class SupplierSearchStrategy extends BaseSearchStrategy<{
  supplier_id: string;
  name: string;
  address: string;
  certificate: string | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}> {
  protected getSearchableText(item: {
    supplier_id: string;
    name: string;
    address: string;
    certificate: string | null;
    description: string | null;
    status: "pending" | "approved" | "rejected";
    created_at: string;
  }): Array<string | number | null | undefined> {
    return [item.supplier_id, item.name, item.address, item.certificate, item.description, item.status, item.created_at];
  }
}

class BatchSearchStrategy extends BaseSearchStrategy<{
  batch_id: string;
  product_id: string;
  supplier_id: string;
  product_name: string | null;
  supplier_name: string | null;
  harvest_date: string;
  expire_date: string;
  qr_code: string | null;
  quantity: number;
  status: "pending" | "available" | "expired" | "sold_out";
  created_at: string;
  updated_at: string;
}> {
  protected getSearchableText(item: {
    batch_id: string;
    product_id: string;
    supplier_id: string;
    product_name: string | null;
    supplier_name: string | null;
    harvest_date: string;
    expire_date: string;
    qr_code: string | null;
    quantity: number;
    status: "pending" | "available" | "expired" | "sold_out";
    created_at: string;
    updated_at: string;
  }): Array<string | number | null | undefined> {
    return [
      item.batch_id,
      item.product_id,
      item.supplier_id,
      item.product_name,
      item.supplier_name,
      item.harvest_date,
      item.expire_date,
      item.qr_code,
      item.quantity,
      item.status,
      item.created_at,
      item.updated_at,
    ];
  }
}

class RoleSearchStrategy extends BaseSearchStrategy<RoleSummary> {
  protected getSearchableText(item: RoleSummary): Array<string | number | null | undefined> {
    return [
      item.role_id,
      item.role_name,
      item.description,
      item.user_count,
      item.is_customer ? "customer" : "",
      item.is_admin ? "admin" : "",
      item.is_manager ? "manager" : "",
      item.is_employee ? "employee" : "",
      item.is_shipper ? "shipper" : "",
    ];
  }
}

class CategorySearchStrategy extends BaseSearchStrategy<{
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
  created_at: string;
}> {
  protected getSearchableText(item: {
    category_id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    product_count: number;
    created_at: string;
  }): Array<string | number | null | undefined> {
    return [item.category_id, item.name, item.description, item.image_url, item.product_count, item.created_at];
  }
}

class InventorySearchStrategy extends BaseSearchStrategy<{
  batch_id: string | null;
  product_name: string | null;
  supplier_name: string | null;
  quantity_available: number;
  quantity_reserved: number;
  batch_status: string | null;
}> {
  protected getSearchableText(item: {
    batch_id: string | null;
    product_name: string | null;
    supplier_name: string | null;
    quantity_available: number;
    quantity_reserved: number;
    batch_status: string | null;
  }): Array<string | number | null | undefined> {
    return [
      item.batch_id,
      item.product_name,
      item.supplier_name,
      item.quantity_available,
      item.quantity_reserved,
      item.batch_status,
    ];
  }
}

class PriceSearchStrategy extends BaseSearchStrategy<{
  batch_id: string | null;
  product_name: string | null;
  supplier_name: string | null;
  price: number;
  date: string;
}> {
  protected getSearchableText(item: {
    batch_id: string | null;
    product_name: string | null;
    supplier_name: string | null;
    price: number;
    date: string;
  }): Array<string | number | null | undefined> {
    return [item.batch_id, item.product_name, item.supplier_name, item.price, item.date];
  }
}

class OrderSearchStrategy extends BaseSearchStrategy<OrderListRow> {
  protected getSearchableText(item: OrderListRow): Array<string | number | null | undefined> {
    return [
      item.order_id,
      item.user_id,
      item.customer_name,
      item.customer_phone,
      item.order_date,
      item.delivery_address,
      item.delivery_fee,
      item.note,
      item.status,
      item.total_amount,
      item.payment_method,
      item.payment_status,
      item.item_count,
    ];
  }
}

class DeliveryTrackingSearchStrategy extends BaseSearchStrategy<DeliveryTrackingRow> {
  protected getSearchableText(item: DeliveryTrackingRow): Array<string | number | null | undefined> {
    return [
      item.delivery_id,
      item.order_id,
      item.employee_id,
      item.shipper_name,
      item.shipper_phone,
      item.customer_name,
      item.customer_phone,
      item.order_date,
      item.delivery_address,
      item.total_amount,
      item.status,
      item.note,
      item.pickup_time,
      item.delivery_time,
    ];
  }
}

export const userSearchStrategy = new UserSearchStrategy();
export const supplierSearchStrategy = new SupplierSearchStrategy();
export const batchSearchStrategy = new BatchSearchStrategy();
export const roleSearchStrategy = new RoleSearchStrategy();
export const categorySearchStrategy = new CategorySearchStrategy();
export const inventorySearchStrategy = new InventorySearchStrategy();
export const priceSearchStrategy = new PriceSearchStrategy();
export const orderSearchStrategy = new OrderSearchStrategy();
export const deliveryTrackingSearchStrategy = new DeliveryTrackingSearchStrategy();