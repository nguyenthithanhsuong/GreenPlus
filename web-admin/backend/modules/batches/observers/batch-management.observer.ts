export type BatchManagementEvent =
  | {
      type: "batch_created";
      batchId: string;
      actor: "admin";
    }
  | {
      type: "batch_updated";
      batchId: string;
      actor: "admin";
    }
  | {
      type: "batch_status_changed";
      batchId: string;
      actor: "admin";
      status: "pending" | "available" | "expired" | "sold_out";
    }
  | {
      type: "batch_deleted";
      batchId: string;
      actor: "admin";
    };

export interface BatchManagementObserver {
  update(event: BatchManagementEvent): Promise<void>;
}

export class BatchManagementSubject {
  private readonly observers = new Set<BatchManagementObserver>();

  attach(observer: BatchManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: BatchManagementEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class BatchManagementAuditObserver implements BatchManagementObserver {
  async update(event: BatchManagementEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}