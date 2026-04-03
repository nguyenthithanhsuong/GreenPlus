import { AppError } from "../../core/errors";
import { CommunityPostRepository } from "./community-post.repository";
import { createCommunityPostState } from "./states/community-post.state";
import { createCommunityMediaStrategy } from "./strategies/community-media.strategy";
import {
  CommunityMediaType,
  CommunityPostCreatedResult,
  CommunityPostSummary,
  CreateCommunityPostInput,
  UpdateCommunityPostInput,
} from "./community-post.types";

export class CommunityPostService {
  private readonly repository = new CommunityPostRepository();
  private readonly mediaStrategy = createCommunityMediaStrategy();

  private formatContentWithMedia(content: string, mediaUrl?: string): string {
    const normalizedContent = content.trim();
    const normalizedMediaUrl = mediaUrl?.trim() ?? "";

    return normalizedMediaUrl
      ? `${normalizedContent}\n\n[media_url] ${normalizedMediaUrl}`
      : normalizedContent;
  }

  private parseStoredContent(raw: string): { content: string; mediaUrl: string | null } {
    const normalized = raw.replace(/\r\n/g, "\n");

    const taggedMatch = normalized.match(/\[(media_url|image_url|video_url)\]\s*:??\s*(https?:\/\/\S+)/i);
    if (taggedMatch) {
      const mediaUrl = taggedMatch[2]?.trim() ?? "";
      const cleaned = normalized
        .replace(/\n*\[(media_url|image_url|video_url)\]\s*:??\s*https?:\/\/\S+\s*$/i, "")
        .trimEnd();

      return {
        content: cleaned,
        mediaUrl: mediaUrl || null,
      };
    }

    const plainUrlMatch = normalized.match(/https?:\/\/\S+/i);
    return {
      content: normalized,
      mediaUrl: plainUrlMatch?.[0] ?? null,
    };
  }

  private toMediaType(type: "community" | "video"): CommunityMediaType {
    if (type === "video") {
      return "MP4";
    }

    return "JPG";
  }

  private toSummary(row: {
    post_id: string;
    user_id: string;
    title: string;
    content: string;
    type: "community" | "video";
    status: "pending" | "approved" | "rejected";
    created_at: string;
  }): CommunityPostSummary {
    const parsed = this.parseStoredContent(row.content);

    return {
      post_id: row.post_id,
      user_id: row.user_id,
      title: row.title,
      content: parsed.content,
      media_type: this.toMediaType(row.type),
      media_url: parsed.mediaUrl,
      type: row.type,
      status: row.status,
      created_at: row.created_at,
    };
  }

  async createPost(input: CreateCommunityPostInput): Promise<CommunityPostCreatedResult> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    const content = input.content.trim();
    if (!content) {
      throw new AppError("content is required", 400);
    }

    if (content.length > 1000) {
      throw new AppError("content must not exceed 1000 characters", 400);
    }

    const mediaType = this.mediaStrategy.normalize(input.mediaType);
    const postType = this.mediaStrategy.toPostType(mediaType);
    const title = (input.title ?? "").trim() || "Community Post";

    let created: {
      post_id: string;
      user_id: string;
      type: "community" | "video";
      status: "pending";
      created_at: string;
    };

    try {
      created = await this.repository.createPost({
        userId: input.userId.trim(),
        title,
        content: this.formatContentWithMedia(content, input.mediaUrl),
        type: postType,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to create post", 500);
    }

    const visibility = createCommunityPostState(created.status);
    if (visibility.canBeVisible()) {
      throw new AppError("New community post must start with pending status", 500);
    }

    return {
      post_id: created.post_id,
      user_id: created.user_id,
      type: created.type,
      status: created.status,
      created_at: created.created_at,
    };
  }

  async listPostsByUser(userId: string): Promise<CommunityPostSummary[]> {
    if (!userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    let rows: Array<{
      post_id: string;
      user_id: string;
      title: string;
      content: string;
      type: "community" | "video";
      status: "pending" | "approved" | "rejected";
      created_at: string;
    }>;

    try {
      rows = await this.repository.getPostsByUserId(userId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load posts", 500);
    }

    return rows.map((row) => this.toSummary(row));
  }

  async updatePost(input: UpdateCommunityPostInput): Promise<CommunityPostSummary> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (!input.postId.trim()) {
      throw new AppError("postId is required", 400);
    }

    const content = input.content.trim();
    if (!content) {
      throw new AppError("content is required", 400);
    }

    if (content.length > 1000) {
      throw new AppError("content must not exceed 1000 characters", 400);
    }

    const mediaType = this.mediaStrategy.normalize(input.mediaType);
    const postType = this.mediaStrategy.toPostType(mediaType);
    const title = (input.title ?? "").trim() || "Community Post";

    let updated: {
      post_id: string;
      user_id: string;
      title: string;
      content: string;
      type: "community" | "video";
      status: "pending" | "approved" | "rejected";
      created_at: string;
    } | null;

    try {
      updated = await this.repository.updatePost({
        postId: input.postId.trim(),
        userId: input.userId.trim(),
        title,
        content: this.formatContentWithMedia(content, input.mediaUrl),
        type: postType,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to update post", 500);
    }

    if (!updated) {
      throw new AppError("Post not found for this user", 404);
    }

    return this.toSummary(updated);
  }
}

export const communityPostService = new CommunityPostService();
