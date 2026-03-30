import {
  CategoryAuditObserver,
  CategoryCacheObserver,
  CategoryChangeNotifier,
} from "../observers/category.observer";
import { CategoryRepository } from "../category.repository";
import { CategoryService } from "../category.service";
import { CategoryBrowseResult, CategorySort } from "../category.types";

export class CategoryFacade {
  private readonly notifier: CategoryChangeNotifier;
  private readonly service: CategoryService;

  constructor() {
    const repository = new CategoryRepository();

    this.service = new CategoryService(repository);

    this.notifier = new CategoryChangeNotifier();
    this.notifier.attach(new CategoryAuditObserver());
    this.notifier.attach(new CategoryCacheObserver());
  }

  async browseCategories(sort: CategorySort = "name_asc"): Promise<CategoryBrowseResult> {
    const result = await this.service.getCategories(sort);

    result.items.forEach((item) => {
      this.notifier.notify({
        categoryId: item.categoryId,
        event: "loaded",
        changedAt: new Date().toISOString(),
      });
    });

    return result;
  }
}

export const categoryFacade = new CategoryFacade();
