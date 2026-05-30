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
}

export const complaintFacade = new ComplaintFacade();
