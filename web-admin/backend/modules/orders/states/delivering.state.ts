import { OrderState } from "./order.state";

export class DeliveringState implements OrderState {
  getName(): string {
    return "delivering";
  }
}
