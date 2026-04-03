import { CommunityPostStatus } from "../community-post.types";

export interface CommunityPostState {
  canBeVisible(): boolean;
}

class PendingCommunityPostState implements CommunityPostState {
  canBeVisible(): boolean {
    return false;
  }
}

class ApprovedCommunityPostState implements CommunityPostState {
  canBeVisible(): boolean {
    return true;
  }
}

class RejectedCommunityPostState implements CommunityPostState {
  canBeVisible(): boolean {
    return false;
  }
}

export function createCommunityPostState(status: CommunityPostStatus): CommunityPostState {
  if (status === "approved") {
    return new ApprovedCommunityPostState();
  }

  if (status === "rejected") {
    return new RejectedCommunityPostState();
  }

  return new PendingCommunityPostState();
}
