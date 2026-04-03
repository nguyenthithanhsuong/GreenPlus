export type LoyaltyAwardInput = {
  orderId: string;
};

export type LoyaltyAwardResult = {
  order_id: string;
  user_id: string;
  earned_points: number;
  total_points: number;
  message: string;
};

export type LoyaltyChangedEvent = {
  userId: string;
  orderId: string;
  points: number;
  event: "awarded";
  changedAt: string;
};
