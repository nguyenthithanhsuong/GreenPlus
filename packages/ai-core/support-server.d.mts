import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupportActor } from "./support-policy.mjs";
export class SupportError extends Error { status: number; constructor(message: string, status?: number); }
export function getThread(db: SupabaseClient, actor: SupportActor, threadId: string): Promise<unknown>;
export function listThreads(db: SupabaseClient, actor: SupportActor): Promise<unknown[]>;
export function startThread(db: SupabaseClient, actor: SupportActor, orderId: string): Promise<unknown>;
export function listMessages(db: SupabaseClient, actor: SupportActor, threadId: string): Promise<unknown[]>;
export function sendMessage(db: SupabaseClient, actor: SupportActor, threadId: string, raw: unknown): Promise<unknown>;
export function escalateThread(db: SupabaseClient, actor: SupportActor, threadId: string): Promise<unknown>;
