import { CreateSubscriptionInput, CreateSubscriptionResult, SubscriptionService } from "../subscription.service";

// Facade cho use case dat lich mua dinh ky.
export class SubscriptionFacade {
  private readonly service = new SubscriptionService();

  async subscribe(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    return this.service.createSubscription(input);
  }
}

export const subscriptionFacade = new SubscriptionFacade();
