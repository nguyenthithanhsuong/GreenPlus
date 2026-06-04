import { supabaseServer } from "../../../core/supabase";

export type ReviewCreatedEvent = {
  productId: string;
  rating: number;
};

export interface ReviewObserver {
  update(event: ReviewCreatedEvent): Promise<void>;
}

export class ReviewSubject {
  private observers: ReviewObserver[] = [];

  addObserver(observer: ReviewObserver): void {
    this.observers.push(observer);
  }

  async notify(event: ReviewCreatedEvent): Promise<void> {
    await Promise.all(this.observers.map((observer) => observer.update(event)));
  }
}

export class ProductRatingUpdaterObserver implements ReviewObserver {
  async update(event: ReviewCreatedEvent): Promise<void> {
    const { data, error } = await supabaseServer
      .from("reviews")
      .select("rating")
      .eq("product_id", event.productId);

    if (error) {
      return;
    }

    const ratings = (data ?? []).map((row) => Number(row.rating));
    const average = ratings.length === 0 ? event.rating : ratings.reduce((sum, value) => sum + value, 0) / ratings.length;

    void average;
  }
}

export class SupplierNotificationObserver implements ReviewObserver {
  async update(): Promise<void> {
    return Promise.resolve();
  }
}
