export interface GeoMatch {
  address: string;
  latitude: number;
  longitude: number;
  source: "photon" | "nominatim";
}
export declare class LocationError extends Error {
  status: number;
  constructor(message: string, status?: number);
}
export declare function validCoordinates(latitude: number, longitude: number): boolean;
export declare function validStreetAddress(value: unknown): boolean;
export declare function geocodeAddress(value: unknown): Promise<GeoMatch[]>;
export declare function resolveDeliveryAddress(value: unknown, hint?: {latitude:number;longitude:number}): Promise<GeoMatch>;
