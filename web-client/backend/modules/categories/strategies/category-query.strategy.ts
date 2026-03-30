import { CategoryItem, CategorySort } from "../category.types";

export interface CategorySortStrategy {
  apply(items: CategoryItem[]): CategoryItem[];
}

export class NameAscSortStrategy implements CategorySortStrategy {
  apply(items: CategoryItem[]): CategoryItem[] {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }
}

export class NameDescSortStrategy implements CategorySortStrategy {
  apply(items: CategoryItem[]): CategoryItem[] {
    return [...items].sort((a, b) => b.name.localeCompare(a.name));
  }
}

export class NewestSortStrategy implements CategorySortStrategy {
  apply(items: CategoryItem[]): CategoryItem[] {
    // categories table currently has no created_at in current schema, so fallback to id order for stable newest-like listing.
    return [...items].sort((a, b) => b.categoryId.localeCompare(a.categoryId));
  }
}

export function createCategorySortStrategy(sort: CategorySort): CategorySortStrategy {
  if (sort === "name_asc") {
    return new NameAscSortStrategy();
  }

  if (sort === "name_desc") {
    return new NameDescSortStrategy();
  }

  return new NewestSortStrategy();
}
