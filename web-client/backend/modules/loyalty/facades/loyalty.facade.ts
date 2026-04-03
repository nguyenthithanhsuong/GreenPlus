import { LoyaltyNotificationObserver, LoyaltySubject } from "../observers/loyalty.observer";
import { LoyaltyService } from "../loyalty.service";
import { LoyaltyAwardInput, LoyaltyAwardResult } from "../loyalty.types";

export class LoyaltyFacade {
  private readonly service = new LoyaltyService();
  private readonly subject = new LoyaltySubject();

  constructor() {
    this.subject.attach(new LoyaltyNotificationObserver());
  }

  async award(input: LoyaltyAwardInput): Promise<LoyaltyAwardResult> {
    const result = await this.service.awardPoints(input);

    this.subject.notify({
      userId: result.user_id,
      orderId: result.order_id,
      points: result.earned_points,
      event: "awarded",
      changedAt: new Date().toISOString(),
    });

    return result;
  }
}

export const loyaltyFacade = new LoyaltyFacade();
