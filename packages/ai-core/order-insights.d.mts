export type OrderAssistantActor={userId:string;storeId:string;role:string};
export type AuthorizedOrderAnswer={answer:string;sources:string[];confidence:number;mode:'authorized_order_lookup';level:'high';handoff:false;degraded:false};
export function readAuthorizedOrderStatus(db:any,actor:OrderAssistantActor,question:string,locale?:'vi'|'en'):Promise<AuthorizedOrderAnswer|null>;
