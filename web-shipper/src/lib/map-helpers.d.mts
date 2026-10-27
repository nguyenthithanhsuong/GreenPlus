export type GeoPoint = {lat:number;lng:number};
export declare function validPoint(value: unknown): value is GeoPoint;
export declare function haversineKm(a: GeoPoint | null, b: GeoPoint | null): number | null;
export declare function convertOsrmResponse(raw: unknown): {
  points: GeoPoint[]; distanceMeters: number; durationSeconds: number;
} | null;
