import { ProductChangedEvent } from "../product.types";

export interface ProductObserver {
  update(event: ProductChangedEvent): void;
}

export interface ProductSubject {
  attach(observer: ProductObserver): void;
  detach(observer: ProductObserver): void;
  notify(event: ProductChangedEvent): void;
}

export class ProductChangeNotifier implements ProductSubject {
  private observers = new Set<ProductObserver>();

  attach(observer: ProductObserver): void {
    this.observers.add(observer);
  }

  detach(observer: ProductObserver): void {
    this.observers.delete(observer);
  }

  notify(event: ProductChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class CacheUpdaterObserver implements ProductObserver {
  private recentlyTouchedProductIds = new Set<string>();
  update(event: ProductChangedEvent): void {
    this.recentlyTouchedProductIds.add(event.productId);
  }

  getTouchedProductIds(): string[] {
    return Array.from(this.recentlyTouchedProductIds);
  }
}

export class SearchIndexUpdaterObserver implements ProductObserver {
  private updatedIndexProductIds = new Set<string>();

  update(event: ProductChangedEvent): void {
    this.updatedIndexProductIds.add(event.productId);
  }

  getUpdatedProductIds(): string[] {
    return Array.from(this.updatedIndexProductIds);
  }
}