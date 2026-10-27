// Server-only: imported exclusively by Next.js route handlers.
import { shipperDb } from './shipper-db';
import { ShipperError, type ShipperUser } from './shipper-auth';
import { allowedTransition, normalizeDelivery, safeOrderId } from '../lib/delivery-contract.mjs';

const columns = 'delivery_id,order_id,employee_id,store_id,status,pickup_time,delivery_time,orders(delivery_address,delivery_latitude,delivery_longitude,total_amount,store_id,users(name))';

type DeliveryRow = {
  delivery_id: string;
  order_id: string;
  employee_id: string;
  store_id: string | null;
  status: string;
  pickup_time: string | null;
  delivery_time: string | null;
  orders: {delivery_address: string | null; delivery_latitude: number | string | null; delivery_longitude: number | string | null; total_amount: number | null; store_id: string | null; users: {name: string | null} | null} | null;
};

async function assignedStores(user: ShipperUser): Promise<Set<string>> {
  const { data, error } = await shipperDb().from('store_members').select('store_id')
    .eq('user_id', user.user_id).eq('status', 'active');
  if (error) throw new ShipperError('Không xác minh được cửa hàng được phân quyền', 503, 'STORE_MEMBERSHIP_FAILED');
  return new Set((data ?? []).map(member => String(member.store_id)));
}

function scoped(row: DeliveryRow): boolean {
  return !!row.store_id && !!row.orders && row.orders.store_id === row.store_id;
}

function present(row: DeliveryRow) {
  return normalizeDelivery({
    delivery_id: row.delivery_id,
    order_id: row.order_id,
    status: row.status,
    pickup_time: row.pickup_time,
    customer_name: row.orders?.users?.name || 'Khách hàng',
    delivery_address: row.orders?.delivery_address ?? '',
    total_amount: row.orders?.total_amount ?? 0,
  });
}

export async function listShipperDeliveries(user: ShipperUser) {
  const stores = await assignedStores(user);
  if (stores.size === 0) return [];
  const {data, error} = await shipperDb().from('deliveries').select(columns)
    .eq('employee_id', user.user_id).in('store_id', Array.from(stores))
    .order('delivery_id', {ascending:false}).limit(100);
  if (error) throw new ShipperError('Không tải được các đơn được phân công', 503, 'DELIVERY_READ_FAILED');
  return ((data ?? []) as unknown as DeliveryRow[])
    .filter(row => scoped(row) && stores.has(row.store_id!)).map(present);
}

export async function updateShipperDelivery(user: ShipperUser, orderId: string, currentStatus: unknown, nextStatus: unknown) {
  if (!safeOrderId(orderId)) throw new ShipperError('Mã đơn không hợp lệ', 400, 'INVALID_ORDER_ID');
  if (typeof currentStatus !== 'string' || typeof nextStatus !== 'string' ||
      !allowedTransition(currentStatus, nextStatus)) {
    throw new ShipperError('Không thể chuyển trạng thái giao hàng như yêu cầu', 409, 'INVALID_STATUS_TRANSITION');
  }
  const stores = await assignedStores(user);
  if (stores.size === 0) throw new ShipperError('Không tìm thấy đơn được giao', 404, 'DELIVERY_NOT_FOUND');
  const db = shipperDb();
  const {data, error} = await db.from('deliveries').select(columns)
    .eq('order_id', orderId).eq('employee_id', user.user_id).maybeSingle();
  if (error) throw new ShipperError('Không thể kiểm tra đơn giao hàng', 503, 'DELIVERY_READ_FAILED');
  const row = data as unknown as DeliveryRow | null;
  if (!row || !scoped(row) || !stores.has(row.store_id!)) throw new ShipperError('Không tìm thấy đơn được giao', 404, 'DELIVERY_NOT_FOUND');
  if (row.status !== currentStatus) throw new ShipperError('Đơn đã được thay đổi. Hãy tải lại.', 409, 'DELIVERY_CONFLICT');
  const patch: Record<string,string> = {status:nextStatus};
  if (nextStatus === 'picked_up') patch.pickup_time = new Date().toISOString();
  if (nextStatus === 'delivered') patch.delivery_time = new Date().toISOString();
  // Compare-and-swap + assignment + store scope to avoid concurrent/cross-tenant mutations.
  const {data: changed, error: updateError} = await db.from('deliveries').update(patch)
    .eq('delivery_id', row.delivery_id).eq('employee_id', user.user_id)
    .eq('store_id', row.store_id!).eq('status', currentStatus).select(columns).maybeSingle();
  if (updateError) throw new ShipperError('Không cập nhật được đơn giao hàng', 503, 'DELIVERY_UPDATE_FAILED');
  const updated = changed as unknown as DeliveryRow | null;
  if (!updated) throw new ShipperError('Đơn đã thay đổi, vui lòng thử lại', 409, 'DELIVERY_CONFLICT');
  if (!scoped(updated)) throw new ShipperError('Cửa hàng của đơn hàng không hợp lệ', 409, 'STORE_MISMATCH');
  return present(updated);
}


/** Read just the verified delivery's store for the embedded map (never trust client store IDs). */
export async function getShipperMapDetails(user: ShipperUser, orderId: string) {
  if (!safeOrderId(orderId)) throw new ShipperError('Mã đơn không hợp lệ', 400, 'INVALID_ORDER_ID');
  const stores = await assignedStores(user);
  if (!stores.size) throw new ShipperError('Không tìm thấy đơn được giao', 404, 'DELIVERY_NOT_FOUND');
  const db = shipperDb();
  const { data, error } = await db.from('deliveries').select(columns)
    .eq('order_id', orderId).eq('employee_id', user.user_id).maybeSingle();
  if (error) throw new ShipperError('Không thể tra cứu đơn giao', 503, 'DELIVERY_READ_FAILED');
  const row = data as unknown as DeliveryRow | null;
  if (!row || !scoped(row) || !stores.has(row.store_id!))
    throw new ShipperError('Không tìm thấy đơn được giao', 404, 'DELIVERY_NOT_FOUND');
  const { data: store, error: storeError } = await db.from('stores')
    .select('store_id,name,address,latitude,longitude')
    .eq('store_id', row.store_id!).maybeSingle();
  if (storeError) throw new ShipperError('Không tải được vị trí cửa hàng', 503, 'STORE_READ_FAILED');
  if (!store) throw new ShipperError('Cửa hàng không còn tồn tại', 404, 'STORE_NOT_FOUND');
  // Numeric(10,...) columns may arrive as strings; null is NOT zero.
  const latitude = store.latitude == null ? null : Number(store.latitude);
  const longitude = store.longitude == null ? null : Number(store.longitude);
  const pickup = latitude != null && longitude != null && Number.isFinite(latitude) &&
    Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { lat: latitude, lng: longitude } : null;
  const dlat = row.orders?.delivery_latitude == null ? NaN : Number(row.orders.delivery_latitude);
  const dlng = row.orders?.delivery_longitude == null ? NaN : Number(row.orders.delivery_longitude);
  const dropoff = Number.isFinite(dlat) && Number.isFinite(dlng) &&
    Math.abs(dlat)<=90 && Math.abs(dlng)<=180 ? {lat:dlat,lng:dlng} : null;
  return {
    orderId: row.order_id,
    pickup,
    dropoff,
    storeName: String(store.name || 'Cửa hàng GreenPlus'),
    storeAddress: String(store.address || ''),
    deliveryAddress: String(row.orders?.delivery_address || ''),
  };
}
