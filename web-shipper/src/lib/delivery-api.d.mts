export declare class DeliveryApiError extends Error { status:number; constructor(message:string,status?:number); }
export declare function makeDeliveryApi(config:{baseUrl:string|undefined;fetcher?:typeof fetch}):{
 list(token:string|null):Promise<import('./delivery-types').Delivery[]>;
 update(token:string|null,id:string,current:string,next:string):Promise<import('./delivery-types').Delivery>;
};
