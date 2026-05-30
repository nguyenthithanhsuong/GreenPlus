import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { ComplaintRow, ComplaintStatus, UpdateComplaintStatusInput } from "./complaint-management.types";

type UserJoin =
  | {
      name?: string | null;
      image_url?: string | null;
    }
  | Array<{
      name?: string | null;
      image_url?: string | null;
    }>
  | null;

type ComplaintDbRow = {
  complaint_id: string;
  user_id: string | null;
  order_id: string | null;
  type: string;
  description: string;
  status: string | null;
  created_at: string | null;
  resolved_at: string | null;
  reject_reason: string | null;
  users?: UserJoin;
};

export class ComplaintManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listComplaints(): Promise<ComplaintRow[]> {
    const { data, error } = await this.supabase
      .from("complaints")
      .select(`
        complaint_id,
        user_id,
        order_id,
        type,
        description,
        status,
        created_at,
        resolved_at,
        reject_reason,
        users(name,image_url)
      `)
      .order("created_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.mapComplaintRow(row as ComplaintDbRow));
  }

  async findById(complaintId: string): Promise<ComplaintRow | null> {
    const { data, error } = await this.supabase
      .from("complaints")
      .select(`
        complaint_id,
        user_id,
        order_id,
        type,
        description,
        status,
        created_at,
        resolved_at,
        reject_reason,
        users(name,image_url)
      `)
      .eq("complaint_id", complaintId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapComplaintRow(data as ComplaintDbRow) : null;
  }

  async updateStatus(input: UpdateComplaintStatusInput): Promise<ComplaintRow | null> {
    const now = new Date().toISOString();
    const payload: {
      status: ComplaintStatus;
      resolved_at: string | null;
      reject_reason: string | null;
    } = {
      status: input.status,
      resolved_at: null,
      reject_reason: null,
    };

    if (input.status === "resolved") {
      payload.resolved_at = now;
      payload.reject_reason = null;
    }

    if (input.status === "rejected") {
      payload.resolved_at = now;
      payload.reject_reason = input.rejectReason?.trim() || null;
    }

    const { data, error } = await this.supabase
      .from("complaints")
      .update(payload)
      .eq("complaint_id", input.complaintId)
      .select(`
        complaint_id,
        user_id,
        order_id,
        type,
        description,
        status,
        created_at,
        resolved_at,
        reject_reason,
        users(name,image_url)
      `)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapComplaintRow(data as ComplaintDbRow) : null;
  }

  private mapComplaintRow(row: ComplaintDbRow): ComplaintRow {
    return {
      complaint_id: row.complaint_id,
      user_id: row.user_id,
      order_id: row.order_id,
      type: row.type,
      description: row.description,
      status: this.normalizeStatus(row.status),
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      reject_reason: row.reject_reason,
      user_name: this.pickUserField(row.users ?? null, "name"),
      user_image_url: this.pickUserField(row.users ?? null, "image_url"),
    };
  }

  private normalizeStatus(status: string | null | undefined): ComplaintStatus {
    if (status === "resolved" || status === "rejected") {
      return status;
    }

    return "pending";
  }

  private pickUserField(user: UserJoin, field: "name" | "image_url"): string | null {
    if (Array.isArray(user)) {
      return user[0]?.[field] ?? null;
    }

    return user?.[field] ?? null;
  }
}