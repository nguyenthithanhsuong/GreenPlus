import { CategoryChangedEvent } from "../category.types";

export interface CategoryObserver {
  update(event: CategoryChangedEvent): void;
}

export interface CategorySubject {
  attach(observer: CategoryObserver): void;
  detach(observer: CategoryObserver): void;
  notify(event: CategoryChangedEvent): void;
}

export class CategoryChangeNotifier implements CategorySubject {
  private readonly observers = new Set<CategoryObserver>();

  attach(observer: CategoryObserver): void {
    this.observers.add(observer);
  }

  detach(observer: CategoryObserver): void {
    this.observers.delete(observer);
  }

  notify(event: CategoryChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class CategoryCacheObserver implements CategoryObserver {
  private readonly touchedCategoryIds = new Set<string>();

  update(event: CategoryChangedEvent): void {
    this.touchedCategoryIds.add(event.categoryId);
  }

  getTouchedCategoryIds(): string[] {
    return Array.from(this.touchedCategoryIds);
  }
}

export class CategoryAuditObserver implements CategoryObserver {
  update(event: CategoryChangedEvent): void {
    const eventType = event.event;
    const categoryId = event.categoryId;
    void eventType;
    void categoryId;
  }
}
