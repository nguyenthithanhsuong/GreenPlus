import { ComplaintManagementRepository } from "./complaint-management.repository";
import { ComplaintManagementService } from "./complaint-management.service";
import { ComplaintRow, ComplaintStatus } from "./complaint-management.types";

export class ComplaintManagementFacade {
  private readonly repository = new ComplaintManagementRepository();
  private readonly service = new ComplaintManagementService(this.repository);

  async listComplaints(): Promise<ComplaintRow[]> {
    return this.service.listComplaints();
  }

  async updateStatus(complaintId: string, status: ComplaintStatus, rejectReason?: string): Promise<ComplaintRow> {
    const nextStatus = this.service.normalizeStatus(status);
    return this.service.updateStatus({ complaintId, status: nextStatus, rejectReason });
  }
}

export const complaintManagementFacade = new ComplaintManagementFacade();