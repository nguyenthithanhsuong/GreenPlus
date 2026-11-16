export type SupportActor = { userId: string; role: string; storeIds: string[]; escalated?: boolean };
export type SupportThread = { store_id: string; customer_id: string; shipper_id: string | null };
export function canAccessOrderThread(actor: SupportActor, thread: SupportThread): boolean;
export function canStartThread(actor: SupportActor, order: { store_id: string; user_id: string; shipper_id: string | null }): boolean;
