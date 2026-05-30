import { BatchManagementRepository } from "../batch-management.repository";
import { BatchManagementService } from "../batch-management.service";
import { BatchManagementAuditObserver, BatchManagementSubject } from "../observers/batch-management.observer";
import { BatchRow, CreateBatchInput, UpdateBatchInput } from "../batch-management.types";

export class BatchManagementFacade {
  private readonly repository = new BatchManagementRepository();
  private readonly service = new BatchManagementService(this.repository);
  private readonly subject = new BatchManagementSubject();

  constructor() {
    this.subject.attach(new BatchManagementAuditObserver());
  }

  async listBatches(): Promise<BatchRow[]> {
    return this.service.listBatches();
  }

  async createBatch(input: CreateBatchInput): Promise<BatchRow> {
    const created = await this.service.createBatch(input);
    await this.subject.notify({ type: "batch_created", batchId: created.batch_id, actor: "admin" });
    return created;
  }

  async updateBatch(input: UpdateBatchInput): Promise<BatchRow> {
    const updated = await this.service.updateBatch(input);
    await this.subject.notify({ type: "batch_updated", batchId: updated.batch_id, actor: "admin" });
    return updated;
  }

  async changeStatus(batchId: string, status: string): Promise<BatchRow> {
    const updated = await this.service.changeStatus(batchId, status);
    await this.subject.notify({ type: "batch_status_changed", batchId, actor: "admin", status: updated.status });
    return updated;
  }

  async deleteBatch(batchId: string): Promise<void> {
    await this.service.deleteBatch(batchId);
    await this.subject.notify({ type: "batch_deleted", batchId, actor: "admin" });
  }
}

export const batchManagementFacade = new BatchManagementFacade();