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

// Observer 1: tinh lai diem trung binh san pham sau khi co review moi.
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

    // Placeholder side-effect: hien tai chua co cot avg_rating trong products.
    // Trong production co the update bang products hoac bang tong hop rieng.
    void average;
  }
}

// Observer 2: placeholder cho thong bao supplier sau khi co danh gia moi.
export class SupplierNotificationObserver implements ReviewObserver {
  async update(): Promise<void> {
    return Promise.resolve();
  }
}
