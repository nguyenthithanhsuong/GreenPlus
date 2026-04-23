export type CategoryManagementEvent =
  | {
      type: "category_created";
      categoryId: string;
      actor: "admin";
    }
  | {
      type: "category_updated";
      categoryId: string;
      actor: "admin";
    }
  | {
      type: "category_deleted";
      categoryId: string;
      actor: "admin";
    };

export interface CategoryManagementObserver {
  update(event: CategoryManagementEvent): Promise<void>;
}

export class CategoryManagementSubject {
  private readonly observers = new Set<CategoryManagementObserver>();

  attach(observer: CategoryManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: CategoryManagementEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class CategoryManagementAuditObserver implements CategoryManagementObserver {
  async update(event: CategoryManagementEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}