import { AppError } from "../../core/errors";
import {
  ComplaintCreatedResult,
  ComplaintType,
  CreateComplaintInput,
} from "./complaint.types";
import { ComplaintRepository } from "./complaint.repository";

const VALID_COMPLAINT_TYPES = new Set<ComplaintType>([
  "quality",
  "damaged",
  "missing_items",
  "wrong_item",
  "late_delivery",
  "other",
]);

export class ComplaintService {
  private readonly repository = new ComplaintRepository();

  async createComplaint(input: CreateComplaintInput): Promise<ComplaintCreatedResult> {
    const userId = input.userId.trim();
    const orderId = input.orderId.trim();
    const description = input.description.trim();
    const type = input.type;

    if (!userId || !orderId || !description) {
      throw new AppError("userId, orderId and description are required", 400);
    }

    if (!VALID_COMPLAINT_TYPES.has(type)) {
      throw new AppError("type is invalid", 400);
    }

    if (description.length < 10) {
      throw new AppError("description must be at least 10 characters", 400);
    }

    let ownedOrder: { order_id: string } | null = null;
    try {
      ownedOrder = await this.repository.findOrderByIdAndUser(orderId, userId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to verify order", 500);
    }

    if (!ownedOrder) {
      throw new AppError("Order not found for this user", 404);
    }

    let created: {
      complaint_id: string;
      user_id: string;
      order_id: string;
      type: ComplaintType;
      description: string;
      status: "pending" | "resolved" | "rejected";
      created_at: string;
    };

    try {
      created = await this.repository.createComplaint({
        userId,
        orderId,
        type,
        description,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to create complaint", 500);
    }

    return {
      complaintId: String(created.complaint_id),
      userId: String(created.user_id),
      orderId: String(created.order_id),
      type: created.type,
      description: String(created.description),
      status: created.status,
      createdAt: String(created.created_at),
    };
  }
}

export const complaintService = new ComplaintService();
