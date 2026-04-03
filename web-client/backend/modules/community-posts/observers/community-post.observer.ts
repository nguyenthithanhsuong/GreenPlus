import { CommunityPostChangedEvent } from "../community-post.types";

export interface CommunityPostObserver {
  update(event: CommunityPostChangedEvent): void;
}

export class CommunityPostSubject {
  private readonly observers = new Set<CommunityPostObserver>();

  attach(observer: CommunityPostObserver): void {
    this.observers.add(observer);
  }

  notify(event: CommunityPostChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class CommunityPostAuditObserver implements CommunityPostObserver {
  update(event: CommunityPostChangedEvent): void {
    const postId = event.postId;
    void postId;
  }
}
