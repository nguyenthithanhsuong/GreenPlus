export type ComplaintStatus = "pending" | "resolved" | "rejected";

export type ComplaintRow = {
  complaint_id: string;
  user_id: string | null;
  order_id: string | null;
  type: string;
  description: string;
  status: ComplaintStatus;
  created_at: string | null;
  resolved_at: string | null;
  reject_reason: string | null;
  user_name: string | null;
  user_image_url: string | null;
};

export type UpdateComplaintStatusInput = {
  complaintId: string;
  status: ComplaintStatus;
  rejectReason?: string;
};
