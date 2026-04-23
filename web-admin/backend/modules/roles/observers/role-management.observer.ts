export type RoleManagementEvent =
  | {
      type: "role_created";
      roleId: string;
      actor: "admin";
    }
  | {
      type: "role_updated";
      roleId: string;
      actor: "admin";
    }
  | {
      type: "role_deleted";
      roleId: string;
      actor: "admin";
    };

export interface RoleManagementObserver {
  update(event: RoleManagementEvent): Promise<void>;
}

export class RoleManagementSubject {
  private readonly observers = new Set<RoleManagementObserver>();

  attach(observer: RoleManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: RoleManagementEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class RoleManagementAuditObserver implements RoleManagementObserver {
  async update(event: RoleManagementEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}
