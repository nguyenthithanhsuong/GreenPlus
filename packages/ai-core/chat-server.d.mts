import type { SupabaseClient } from "@supabase/supabase-js";
export class ChatError extends Error { status:number; constructor(message:string,status?:number); }
export type ChatActor = {storeId:string;userId:string;role:"admin"|"manager"|"employee"|"shipper"|"customer"};
export type ChatResponse = {conversationId:string;answer:string;mode:string;level:"low"|"medium"|"high";confidence:number;sources:string[];handoff:boolean;degraded?:boolean};
export function askStoreChat(db:SupabaseClient,actor:ChatActor,message:unknown,prior?:unknown,level?:"low"|"medium"|"high",locale?:"vi"|"en"):Promise<ChatResponse>;
export function readStoreChat(db:SupabaseClient,actor:ChatActor,id:string):Promise<unknown[]>;
