export type GeoPoint = {lat:number;lng:number};
export declare function validPoint(value: unknown): value is GeoPoint;
export declare function databasePoint(latitude: number | string | null | undefined, longitude: number | string | null | undefined): GeoPoint | null;
export declare function googleMapsNavigationUrl(destination: GeoPoint | null, origin?: GeoPoint | null): string | null;
export declare function haversineKm(a: GeoPoint | null, b: GeoPoint | null): number | null;
export declare function convertOsrmResponse(raw: unknown): {
  points: GeoPoint[]; distanceMeters: number; durationSeconds: number;
} | null;

export declare function checkedStorePickup(
  store: { store_id: string; address?: string | null; ward?: string | null; district?: string | null; city?: string | null; latitude: number | string | null; longitude: number | string | null } | null,
  otherStoresAtPoint?: Array<{ store_id: string; address?: string | null; ward?: string | null; district?: string | null; city?: string | null }>,
): {pickup: GeoPoint | null; warning: string | null};
