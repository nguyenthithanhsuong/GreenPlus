import { AppError } from "../../core/errors";
import {
  GroupPurchaseRepository,
  GroupPurchaseRow,
  readRelationValue,
} from "./group-purchase.repository";
import {
  CreateGroupPurchaseInput,
  GroupPurchaseItem,
  GroupPurchaseStatus,
  JoinGroupPurchaseInput,
} from "./group-purchase.types";
import { createGroupPurchaseState } from "./states/group-purchase.state";
import { createGroupCapacityStrategy } from "./strategies/group-capacity.strategy";

export class GroupPurchaseService {
  private readonly repository = new GroupPurchaseRepository();
  private readonly capacityStrategy = createGroupCapacityStrategy();

  private mapGroup(row: GroupPurchaseRow): GroupPurchaseItem {
    const remaining = Math.max(0, Number(row.target_quantity) - Number(row.current_quantity));
    const canJoin = createGroupPurchaseState(row.status).canJoin() && remaining > 0;

    return {
      group_id: row.group_id,
      product_id: row.product_id,
      product_name: readRelationValue<string>(row.products, "name"),
      leader_id: row.leader_id,
      target_quantity: Number(row.target_quantity),
      current_quantity: Number(row.current_quantity),
      min_quantity: Number(row.min_quantity),
      discount_price: row.discount_price === null ? null : Number(row.discount_price),
      deadline: row.deadline,
      status: row.status,
      remaining_quantity: remaining,
      can_join: canJoin,
    };
  }

  async listJoinableGroups(): Promise<GroupPurchaseItem[]> {
    let rows: GroupPurchaseRow[] = [];
    try {
      rows = await this.repository.listOpenGroups();
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load group purchases", 500);
    }

    return rows.map((row) => this.mapGroup(row));
  }

  async joinGroup(input: JoinGroupPurchaseInput): Promise<{ group_id: string; user_id: string; joined_quantity: number; status: GroupPurchaseStatus }> {
    if (!input.groupId.trim() || !input.userId.trim()) {
      throw new AppError("groupId and userId are required", 400);
    }

    let group: GroupPurchaseRow | null = null;
    try {
      group = await this.repository.findGroupById(input.groupId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load group purchase", 500);
    }

    if (!group) {
      throw new AppError("Group purchase not found", 404);
    }

    if (!createGroupPurchaseState(group.status).canJoin()) {
      throw new AppError("Group is not active", 400);
    }

    const quantity = Number(input.quantity);
    this.capacityStrategy.ensureCanJoin(Number(group.current_quantity), Number(group.target_quantity), quantity);

    let duplicate = false;
    try {
      duplicate = await this.repository.hasMember(group.group_id, input.userId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to check membership", 500);
    }

    if (duplicate) {
      throw new AppError("Duplicate join is not allowed", 400);
    }

    const nextQuantity = Number(group.current_quantity) + quantity;
    const nextStatus: GroupPurchaseStatus = nextQuantity >= Number(group.target_quantity) ? "success" : "open";

    try {
      await this.repository.insertMember(group.group_id, input.userId.trim(), quantity);
      await this.repository.updateGroupProgress(group.group_id, nextQuantity, nextStatus);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to join group purchase", 500);
    }

    return {
      group_id: group.group_id,
      user_id: input.userId.trim(),
      joined_quantity: quantity,
      status: nextStatus,
    };
  }

  async createGroup(input: CreateGroupPurchaseInput): Promise<{ group_id: string; status: GroupPurchaseStatus }> {
    const userId = input.userId.trim();
    const productId = input.productId.trim();
    const targetQuantity = Number(input.targetQuantity);
    const minQuantity = Number(input.minQuantity);
    const discountPrice = typeof input.discountPrice === "number" ? Number(input.discountPrice) : null;

    if (!userId || !productId) {
      throw new AppError("userId and productId are required", 400);
    }

    if (!Number.isFinite(targetQuantity) || !Number.isFinite(minQuantity) || targetQuantity <= 0 || minQuantity <= 0) {
      throw new AppError("targetQuantity and minQuantity must be > 0", 400);
    }

    if (targetQuantity < minQuantity) {
      throw new AppError("targetQuantity must be >= minQuantity", 400);
    }

    if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0)) {
      throw new AppError("discountPrice must be >= 0", 400);
    }

    const deadlineDate = new Date(input.deadline);
    if (Number.isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
      throw new AppError("deadline must be a valid future datetime", 400);
    }

    try {
      const product = await this.repository.findActiveProductById(productId);
      if (!product) {
        throw new AppError("Product is not available for group purchase", 400);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error instanceof Error ? error.message : "Failed to verify product", 500);
    }

    try {
      return await this.repository.createGroup({
        productId,
        leaderId: userId,
        targetQuantity,
        minQuantity,
        discountPrice,
        deadline: deadlineDate.toISOString(),
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to create group purchase", 500);
    }
  }
}

export const groupPurchaseService = new GroupPurchaseService();
