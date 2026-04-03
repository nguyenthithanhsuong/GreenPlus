import { BlogSummary } from "../blog.types";

export interface BlogSortStrategy {
  apply(items: BlogSummary[]): BlogSummary[];
}

class LatestBlogSortStrategy implements BlogSortStrategy {
  apply(items: BlogSummary[]): BlogSummary[] {
    return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export function createBlogSortStrategy(): BlogSortStrategy {
  return new LatestBlogSortStrategy();
}
