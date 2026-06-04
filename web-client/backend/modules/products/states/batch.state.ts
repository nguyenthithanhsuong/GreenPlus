import { BatchStatus } from "../product.types";


export interface BatchState {
  isSellable(quantityAvailable: number, expireDate: string): boolean;
}


class AvailableBatchState implements BatchState {
  isSellable(quantityAvailable: number, expireDate: string): boolean {
    const isExpired = new Date(expireDate).getTime() < Date.now();
    return !isExpired && quantityAvailable > 0;
  }
}


class ExpiredBatchState implements BatchState {
  isSellable(): boolean {
    return false;
  }
}


class SoldOutBatchState implements BatchState {
  isSellable(): boolean {
    return false;
  }
}

export function createBatchState(status: BatchStatus): BatchState {
  switch (status) {
    case "available":
      return new AvailableBatchState();
    case "expired":
      return new ExpiredBatchState();
    case "sold_out":
      return new SoldOutBatchState();
    default:
      return new SoldOutBatchState(); 
  }
}