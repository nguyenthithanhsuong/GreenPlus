export type ShippingConfig={base_fee:number;per_km:number;min_fee:number;free_from:number;max_radius_km:number;distance_factor:number};
export type Coordinates={latitude:number;longitude:number};
export const DEFAULT_SHIPPING:Readonly<ShippingConfig>;
export function normalizeShippingConfig(input:Partial<ShippingConfig>|Record<string,unknown>|null|undefined,options?:{strict?:boolean}):ShippingConfig;
export function distanceKm(origin:Coordinates|null|undefined,destination:Coordinates|null|undefined,factor?:number):number|null;
export function quoteShipping(config:Partial<ShippingConfig>|Record<string,unknown>|null|undefined,store:Coordinates|null|undefined,destination:Coordinates|null|undefined,options?:{cartSubtotal?:number}):{fee:number;distance_km:number|null;distance_kind:'flat_fallback'|'straight_line_estimate';currency:'VND';free:boolean;config:ShippingConfig};
