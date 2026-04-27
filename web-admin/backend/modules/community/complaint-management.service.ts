import { AppError } from "../../core/errors";
import { ComplaintManagementRepository } from "./complaint-management.repository";
import { ComplaintRow, ComplaintStatus, UpdateComplaintStatusInput } from "./complaint-management.types";

export class ComplaintManagementService {
  constructor(private readonly repository: ComplaintManagementRepository) {}

  async listComplaints(): Promise<ComplaintRow[]> {
    return this.repository.listComplaints();
  }

  async updateStatus(input: UpdateComplaintStatusInput): Promise<ComplaintRow> {
    if (!input.complaintId.trim()) {
      throw new AppError("complaintId is required", 400);
    }

    const existing = await this.repository.findById(input.complaintId);
    if (!existing) {
      throw new AppError("Complaint not found", 404);
    }

    if (input.status === "rejected" && !input.rejectReason?.trim()) {
      throw new AppError("rejectReason is required when status is rejected", 400);
    }

    const updated = await this.repository.updateStatus(input);
    if (!updated) {
      throw new AppError("Complaint not found", 404);
    }

    return updated;
  }

  normalizeStatus(status: string | undefined): ComplaintStatus {
    if (status === "resolved" || status === "rejected") {
      return status;
    }

    return "pending";
  }
}
