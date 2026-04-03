import {
  GroupPurchaseAuditObserver,
  GroupPurchaseSubject,
} from "../observers/group-purchase.observer";
import { GroupPurchaseService } from "../group-purchase.service";
import { CreateGroupPurchaseInput, GroupPurchaseItem, JoinGroupPurchaseInput } from "../group-purchase.types";

export class GroupPurchaseFacade {
  private readonly service = new GroupPurchaseService();
  private readonly subject = new GroupPurchaseSubject();

  constructor() {
    this.subject.attach(new GroupPurchaseAuditObserver());
  }

  async listGroups(): Promise<GroupPurchaseItem[]> {
    return this.service.listJoinableGroups();
  }

  async joinGroup(input: JoinGroupPurchaseInput): Promise<{ group_id: string; user_id: string; joined_quantity: number; status: string }> {
    const result = await this.service.joinGroup(input);

    this.subject.notify({
      groupId: result.group_id,
      event: "joined",
      changedAt: new Date().toISOString(),
    });

    return result;
  }

  async createGroup(input: CreateGroupPurchaseInput): Promise<{ group_id: string; status: string }> {
    const result = await this.service.createGroup(input);

    this.subject.notify({
      groupId: result.group_id,
      event: "created",
      changedAt: new Date().toISOString(),
    });

    return result;
  }
}

export const groupPurchaseFacade = new GroupPurchaseFacade();
