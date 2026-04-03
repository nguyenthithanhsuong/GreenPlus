import { BlogViewedEvent } from "../blog.types";

export interface BlogObserver {
  update(event: BlogViewedEvent): void;
}

export class BlogSubject {
  private readonly observers = new Set<BlogObserver>();

  attach(observer: BlogObserver): void {
    this.observers.add(observer);
  }

  notify(event: BlogViewedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class BlogAuditObserver implements BlogObserver {
  update(event: BlogViewedEvent): void {
    const postId = event.postId;
    void postId;
  }
}
