export type UserManagementEvent =
  | {
      type: "user_created";
      userId: string;
      actor: "admin";
    }
  | {
      type: "user_updated";
      userId: string;
      actor: "admin";
    }
  | {
      type: "user_disabled";
      userId: string;
      actor: "admin";
    }
  | {
      type: "user_deleted";
      userId: string;
      actor: "admin";
    };

export interface UserManagementObserver {
  update(event: UserManagementEvent): Promise<void>;
}

export class UserManagementSubject {
  private readonly observers = new Set<UserManagementObserver>();

  attach(observer: UserManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: UserManagementEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class UserManagementAuditObserver implements UserManagementObserver {
  async update(event: UserManagementEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}
