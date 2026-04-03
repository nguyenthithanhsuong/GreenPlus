export type GroupPurchaseStatus = "open" | "success" | "failed" | "closed";

export type GroupPurchaseItem = {
  group_id: string;
  product_id: string;
  product_name: string | null;
  leader_id: string;
  target_quantity: number;
  current_quantity: number;
  min_quantity: number;
  discount_price: number | null;
  deadline: string;
  status: GroupPurchaseStatus;
  remaining_quantity: number;
  can_join: boolean;
};

export type JoinGroupPurchaseInput = {
  groupId: string;
  userId: string;
  quantity: number;
};

export type CreateGroupPurchaseInput = {
  userId: string;
  productId: string;
  targetQuantity: number;
  minQuantity: number;
  discountPrice?: number;
  deadline: string;
};

export type GroupPurchaseChangedEvent = {
  groupId: string;
  event: "created" | "joined";
  changedAt: string;
};
