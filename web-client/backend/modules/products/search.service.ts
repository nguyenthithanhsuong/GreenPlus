import { AppError } from "../../core/errors";
import { ProductService } from "./product.service";
import {
  CategoryFilterStrategy,
  CertificationFilterStrategy,
  createSortStrategy,
  NameFilterStrategy,
  PriceRangeFilterStrategy,
  ProductFilterStrategy,
} from "./strategies/product-query.strategy";
import { BrowseResult, SearchCriteria } from "./product.types";

const DEFAULT_LIMIT = 20;

export class SearchService {
  private readonly filterStrategies: ProductFilterStrategy[];

  constructor(private readonly productService: ProductService) {
    this.filterStrategies = [
      new NameFilterStrategy(),
      new CategoryFilterStrategy(),
      new CertificationFilterStrategy(),
      new PriceRangeFilterStrategy(),
    ];
  }

  async search(criteria: SearchCriteria): Promise<BrowseResult> {
    const page = criteria.page ?? 1;
    const limit = criteria.limit ?? DEFAULT_LIMIT;

    if (page < 1) {
      throw new AppError("page must be at least 1");
    }

    if (limit < 1 || limit > 100) {
      throw new AppError("limit must be between 1 and 100");
    }

    const keywordProvided = criteria.keyword !== undefined;
    const keyword = criteria.keyword?.trim() ?? "";
    const hasAnyFilter = Boolean(criteria.categoryId || criteria.certification || criteria.minPrice !== undefined || criteria.maxPrice !== undefined);

    // Bám theo SRS: neu nguoi dung co y dinh search ma keyword rong va khong co bo loc thi bao MSG1.
    if (keywordProvided && keyword.length === 0 && !hasAnyFilter) {
      throw new AppError("MSG1: Keyword must contain at least one character", 400);
    }

    const normalizedCriteria: SearchCriteria = {
      ...criteria,
      keyword,
      page,
      limit,
    };

    let items = await this.productService.getActiveBrowseItems();

    // Pipeline strategy: them/xoa bo loc rat de, khong can sua code tim kiem co loi.
    this.filterStrategies.forEach((strategy) => {
      items = strategy.apply(items, normalizedCriteria);
    });

    const sorted = createSortStrategy(criteria.sort ?? "newest").apply(items);
    const startIndex = (page - 1) * limit;

    return {
      page,
      limit,
      total: sorted.length,
      items: sorted.slice(startIndex, startIndex + limit),
    };
  }
}
