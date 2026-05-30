import {
  CancelSubscriptionInput,
  CancelSubscriptionResult,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  UpdateSubscriptionInput,
  SubscriptionService,
  SubscriptionSummary,
} from "../subscription.service";
import {
  SubscriptionAuditObserver,
  SubscriptionSubject,
} from "../observers/subscription.observer";

// Facade cho use case dat lich mua dinh ky.
export class SubscriptionFacade {
  private readonly service = new SubscriptionService();
  private readonly subject = new SubscriptionSubject();

  constructor() {
    this.subject.attach(new SubscriptionAuditObserver());
  }

  async subscribe(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    const created = await this.service.createSubscription(input);

    this.subject.notify({
      subscriptionId: created.subscriptionId,
      userId: created.userId,
      productId: created.productId,
      event: "created",
      changedAt: new Date().toISOString(),
    });

    return created;
  }

  async listByUserId(userId: string): Promise<SubscriptionSummary[]> {
    return this.service.listSubscriptionsByUserId(userId);
  }

  async unsubscribe(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
    const cancelled = await this.service.cancelSubscription(input);

    this.subject.notify({
      subscriptionId: cancelled.subscriptionId,
      userId: cancelled.userId,
      productId: cancelled.productId,
      event: "cancelled",
      changedAt: new Date().toISOString(),
    });

    return cancelled;
  }

  async updateSubscription(input: UpdateSubscriptionInput): Promise<SubscriptionSummary> {
    const updated = await this.service.updateSubscription(input);

    this.subject.notify({
      subscriptionId: updated.subscriptionId,
      userId: updated.userId,
      productId: updated.productId,
      event: "updated",
      changedAt: new Date().toISOString(),
    });

    return updated;
  }
}

export const subscriptionFacade = new SubscriptionFacade();
