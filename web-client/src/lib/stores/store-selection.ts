export type ActiveStore = {
  store_id: string;
  name: string;
  address: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};
const STORAGE_KEY = "greenplus:selected-store-v2";
export const STORE_CHANGE_EVENT = "greenplus:store-changed";
export function selectedStoreId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
export function selectStore(id: string) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY) === id) return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(
    new CustomEvent(STORE_CHANGE_EVENT, { detail: { storeId: id } }),
  );
}
export function clearSelectedStore() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(STORE_CHANGE_EVENT, { detail: { storeId: null } }),
  );
}
const toNumber = (n: string | number | null) => (n === null ? NaN : Number(n));
/** Straight-line distance only. Road distance and delivery fees belong to the backend. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: Pick<ActiveStore, "latitude" | "longitude">,
) {
  const lat = toNumber(b.latitude),
    lng = toNumber(b.longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return Infinity;
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(lat - a.latitude),
    dLng = rad(lng - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function nearestStore(
  stores: ActiveStore[],
  position: { latitude: number; longitude: number },
) {
  return (
    [...stores]
      .map((store) => ({ store, km: distanceKm(position, store) }))
      .filter((x) => Number.isFinite(x.km))
      .sort((a, b) => a.km - b.km)[0] ?? null
  );
}
