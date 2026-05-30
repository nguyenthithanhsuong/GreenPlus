import { AppError } from "../../core/errors";
import { BlogRepository } from "./blog.repository";
import { createBlogVisibilityState } from "./states/blog-visibility.state";
import { createBlogSortStrategy } from "./strategies/blog-query.strategy";
import { BlogDetail, BlogSummary } from "./blog.types";

export class BlogService {
  private readonly repository = new BlogRepository();

  private extractImageUrl(content: string): string | null {
    const markdownImageMatch = content.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
    if (markdownImageMatch?.[1]) {
      return markdownImageMatch[1];
    }

    const urlMatches = Array.from(content.matchAll(/https?:\/\/[^\s"')]+/gi)).map((match) => match[0]);
    const knownImageHosts = ["gstatic.com", "googleusercontent.com", "imgur.com", "unsplash.com", "cloudinary.com"];

    for (const rawUrl of urlMatches) {
      const normalizedUrl = rawUrl.replace(/[),.;!?]+$/, "");
      try {
        const parsed = new URL(normalizedUrl);
        const pathname = parsed.pathname.toLowerCase();
        const hostname = parsed.hostname.toLowerCase();
        const queryQ = parsed.searchParams.get("q") ?? "";

        const hasImageExtension = /\.(?:png|jpe?g|gif|webp|svg|avif|bmp)$/.test(pathname);
        const isKnownImageHost = knownImageHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
        const isGoogleImageProxy = queryQ.includes("tbn:");

        if (hasImageExtension || isKnownImageHost || isGoogleImageProxy) {
          return normalizedUrl;
        }
      } catch {
        // Ignore malformed URLs and continue scanning the content.
      }
    }

    return null;
  }

  async listPublishedBlogs(): Promise<BlogSummary[]> {
    let rows: Awaited<ReturnType<BlogRepository["listBlogPosts"]>> = [];
    try {
      rows = await this.repository.listBlogPosts();
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load blogs", 500);
    }

    const visible = rows
      .filter((row) => createBlogVisibilityState(row.status).canDisplay())
      .map((row) => ({
        post_id: String(row.post_id),
        title: String(row.title),
        status: row.status,
        created_at: String(row.created_at),
        excerpt: String(row.content ?? "").slice(0, 160),
        image_url: this.extractImageUrl(String(row.content ?? "")),
      }));

    return createBlogSortStrategy().apply(visible);
  }

  async getPublishedBlog(postId: string): Promise<BlogDetail> {
    if (!postId.trim()) {
      throw new AppError("postId is required", 400);
    }

    let row: Awaited<ReturnType<BlogRepository["findBlogById"]>> = null;
    try {
      row = await this.repository.findBlogById(postId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load blog", 500);
    }

    if (!row) {
      throw new AppError("Blog post not found", 404);
    }

    if (!createBlogVisibilityState(row.status).canDisplay()) {
      throw new AppError("Blog post is not published", 403);
    }

    return {
      post_id: String(row.post_id),
      title: String(row.title),
      content: String(row.content),
      status: row.status,
      created_at: String(row.created_at),
      user_id: String(row.user_id),
      image_url: this.extractImageUrl(String(row.content ?? "")),
    };
  }
}

export const blogService = new BlogService();
