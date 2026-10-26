export declare const DELIVERY_STATUSES:readonly string[];
export declare function normalizeDelivery(row:unknown):import('./delivery-types').Delivery;
export declare function allowedTransition(from:string,to:string):boolean;
export declare function safeOrderId(id:unknown):boolean;
