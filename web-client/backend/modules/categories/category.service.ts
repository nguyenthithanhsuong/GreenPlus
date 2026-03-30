import { createCategoryState } from "./states/category.state";
import { createCategorySortStrategy } from "./strategies/category-query.strategy";
import { CategoryRepository } from "./category.repository";
import { CategoryBrowseResult, CategoryItem, CategorySort } from "./category.types";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async getCategories(sort: CategorySort): Promise<CategoryBrowseResult> {
    const rows = await this.repository.listCategories();

    const mapped: CategoryItem[] = rows
      .filter((row) => createCategoryState(row.name).canDisplay())
      .map((row) => ({
        categoryId: row.category_id,
        name: row.name,
        description: row.description,
      }));

    const sorted = createCategorySortStrategy(sort).apply(mapped);

    return {
      total: sorted.length,
      items: sorted,
    };
  }
}
