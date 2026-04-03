import { BlogStatus } from "../blog.types";

export interface BlogVisibilityState {
  canDisplay(): boolean;
}

class VisibleBlogState implements BlogVisibilityState {
  canDisplay(): boolean {
    return true;
  }
}

class HiddenBlogState implements BlogVisibilityState {
  canDisplay(): boolean {
    return false;
  }
}

export function createBlogVisibilityState(status: BlogStatus): BlogVisibilityState {
  if (status === "approved" || status === "published") {
    return new VisibleBlogState();
  }

  return new HiddenBlogState();
}
