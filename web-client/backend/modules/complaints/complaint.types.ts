export type ComplaintStatus = "pending" | "resolved" | "rejected";

export type ComplaintType =
  | "quality"
  | "damaged"
  | "missing_items"
  | "wrong_item"
  | "late_delivery"
  | "other";

export type CreateComplaintInput = {
  userId: string;
  orderId: string;
  type: ComplaintType;
  description: string;
};

export type ComplaintCreatedResult = {
  complaintId: string;
  userId: string;
  orderId: string;
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
};
