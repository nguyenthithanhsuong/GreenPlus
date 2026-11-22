import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupportActor } from './support-policy.mjs';
export function listInquiries(db: SupabaseClient, actor: SupportActor): Promise<unknown[]>;
export function getInquiry(db: SupabaseClient, actor: SupportActor, id: string): Promise<unknown>;
export function startInquiry(db: SupabaseClient, actor: SupportActor, subject: unknown): Promise<unknown>;
export function listInquiryMessages(db: SupabaseClient, actor: SupportActor, id: string): Promise<unknown[]>;
export function sendInquiryMessage(db: SupabaseClient, actor: SupportActor, id: string, body: unknown): Promise<unknown>;
export function resolveInquiry(db: SupabaseClient, actor: SupportActor, id: string): Promise<unknown>;
export function escalateInquiry(db: SupabaseClient, actor: SupportActor, id: string): Promise<unknown>;
