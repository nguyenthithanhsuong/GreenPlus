export type AuthDomainEvent =
  | {
      type: "register_succeeded";
      userId: string;
      email: string;
    }
  | {
      type: "sign_in_succeeded";
      userId: string;
      email: string;
    }
  | {
      type: "profile_updated";
      userId: string;
    }
  | {
      type: "password_changed";
      userId: string;
    };

export interface AuthObserver {
  update(event: AuthDomainEvent): Promise<void>;
}

export class AuthSubject {
  private readonly observers = new Set<AuthObserver>();

  attach(observer: AuthObserver): void {
    this.observers.add(observer);
  }

  async notify(event: AuthDomainEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class AuthAuditObserver implements AuthObserver {
  async update(event: AuthDomainEvent): Promise<void> {
    const eventType = event.type;
    const userId = event.userId;

    // Placeholder for app logging/auditing side effects.
    void eventType;
    void userId;

    return Promise.resolve();
  }
}
