import type { SupabaseClient } from "@supabase/supabase-js";
export class ChatError extends Error { status:number; constructor(message:string,status?:number); }
export type ChatActor = {storeId:string;userId:string;role:"admin"|"manager"|"employee"|"shipper"|"customer"};
export type ChatResponse = {conversationId:string;answer:string;mode:string;confidence:number;sources:string[];handoff:boolean};
export function askStoreChat(db:SupabaseClient,actor:ChatActor,message:unknown,prior?:unknown):Promise<ChatResponse>;
export function readStoreChat(db:SupabaseClient,actor:ChatActor,id:string):Promise<unknown[]>;
