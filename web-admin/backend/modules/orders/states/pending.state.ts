import { OrderState } from "./order.state";

export class PendingState implements OrderState {
  getName(): string {
    return "pending";
  }
}
