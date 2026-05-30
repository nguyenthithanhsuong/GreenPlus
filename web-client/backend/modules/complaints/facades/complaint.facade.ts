import {
  ComplaintCreatedResult,
  CreateComplaintInput,
} from "../complaint.types";
import { ComplaintService } from "../complaint.service";

export class ComplaintFacade {
  private readonly service = new ComplaintService();

  async submitComplaint(input: CreateComplaintInput): Promise<ComplaintCreatedResult> {
    return this.service.createComplaint(input);
  }

  async listComplaintsByUser(userId: string): Promise<ComplaintCreatedResult[]> {
    return this.service.listComplaintsByUser(userId);
  }
}

export const complaintFacade = new ComplaintFacade();
