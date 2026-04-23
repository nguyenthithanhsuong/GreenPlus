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
  name: string;
  email: string;
  role_name: string | null;
  phone: string | null;
  address: string | null;
  status: string;
}> {
  protected getSearchableText(item: {
    name: string;
    email: string;
    role_name: string | null;
    phone: string | null;
    address: string | null;
    status: string;
  }): Array<string | number | null | undefined> {
    return [item.name, item.email, item.role_name, item.phone, item.address, item.status];
  }
}

class SupplierSearchStrategy extends BaseSearchStrategy<{
  name: string;
  address: string;
  certificate: string | null;
  description: string | null;
  status: string;
}> {
  protected getSearchableText(item: {
    name: string;
    address: string;
    certificate: string | null;
    description: string | null;
    status: string;
  }): Array<string | number | null | undefined> {
    return [item.name, item.address, item.certificate, item.description, item.status];
  }
}

class BatchSearchStrategy extends BaseSearchStrategy<{
  batch_id: string;
  product_name: string | null;
  supplier_name: string | null;
  harvest_date: string;
  expire_date: string;
  qr_code: string | null;
  quantity: number;
  status: string;
}> {
  protected getSearchableText(item: {
    batch_id: string;
    product_name: string | null;
    supplier_name: string | null;
    harvest_date: string;
    expire_date: string;
    qr_code: string | null;
    quantity: number;
    status: string;
  }): Array<string | number | null | undefined> {
    return [item.batch_id, item.product_name, item.supplier_name, item.harvest_date, item.expire_date, item.qr_code, item.quantity, item.status];
  }
}

class RoleSearchStrategy extends BaseSearchStrategy<{
  role_name: string;
  description: string | null;
  user_count: number;
  is_system_role: boolean;
}> {
  protected getSearchableText(item: {
    role_name: string;
    description: string | null;
    user_count: number;
    is_system_role: boolean;
  }): Array<string | number | null | undefined> {
    return [item.role_name, item.description, item.user_count, item.is_system_role ? "system" : "custom"];
  }
}

class CategorySearchStrategy extends BaseSearchStrategy<{
  name: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
}> {
  protected getSearchableText(item: {
    name: string;
    description: string | null;
    image_url: string | null;
    product_count: number;
  }): Array<string | number | null | undefined> {
    return [item.name, item.description, item.image_url, item.product_count];
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

class OrderSearchStrategy extends BaseSearchStrategy<{
  order_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string;
  note: string | null;
  status: string;
  total_amount: number;
}> {
  protected getSearchableText(item: {
    order_id: string;
    customer_name: string | null;
    customer_phone: string | null;
    delivery_address: string;
    note: string | null;
    status: string;
    total_amount: number;
  }): Array<string | number | null | undefined> {
    return [
      item.order_id,
      item.customer_name,
      item.customer_phone,
      item.delivery_address,
      item.note,
      item.status,
      item.total_amount,
    ];
  }
}

class DeliveryTrackingSearchStrategy extends BaseSearchStrategy<{
  order_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string;
  latest_status: string;
  latest_note: string | null;
  latest_tracking_at: string | null;
  tracking_count: number;
}> {
  protected getSearchableText(item: {
    order_id: string;
    customer_name: string | null;
    customer_phone: string | null;
    delivery_address: string;
    latest_status: string;
    latest_note: string | null;
    latest_tracking_at: string | null;
    tracking_count: number;
  }): Array<string | number | null | undefined> {
    return [
      item.order_id,
      item.customer_name,
      item.customer_phone,
      item.delivery_address,
      item.latest_status,
      item.latest_note,
      item.latest_tracking_at,
      item.tracking_count,
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