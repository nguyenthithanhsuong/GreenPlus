import { AppError } from "../../core/errors";
import { CommunityPostRepository } from "./community-post.repository";
import { createCommunityPostState } from "./states/community-post.state";
import { createCommunityAttachmentStrategy } from "./strategies/community-attachment.strategy";
import { createCommunityMediaStrategy } from "./strategies/community-media.strategy";
import {
  CommunityPostType,
  CommunityMediaType,
  CommunityPostCreatedResult,
  CommunityPostSummary,
  CreateCommunityPostInput,
  DeleteCommunityPostInput,
  UploadCommunityAttachmentInput,
  UploadCommunityAttachmentResult,
  UpdateCommunityPostInput,
} from "./community-post.types";

export class CommunityPostService {
  private readonly repository = new CommunityPostRepository();
  private readonly mediaStrategy = createCommunityMediaStrategy();
  private readonly attachmentStrategy = createCommunityAttachmentStrategy();

  private formatContentWithMedia(content: string): string {
    return content.trim();
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

  private toMediaType(type: CommunityPostType): CommunityMediaType {
    if (type === "video") {
      return "MP4";
    }

    return "JPG";
  }

  private inferMediaType(type: CommunityPostType, mediaUrls: string[], fallbackUrl: string | null): CommunityMediaType {
    const firstUrl = mediaUrls[0] ?? fallbackUrl ?? "";
    const normalized = firstUrl.toLowerCase();

    if (normalized.endsWith(".mp4") || normalized.includes(".mp4?")) {
      return "MP4";
    }

    if (normalized.endsWith(".png") || normalized.includes(".png?")) {
      return "PNG";
    }

    return this.toMediaType(type);
  }

  private toSummary(row: {
    post_id: string;
    user_id: string;
    title: string;
    content: string;
      type: CommunityPostType;
    status: "pending" | "approved" | "rejected";
    created_at: string;
  }, mediaUrls: string[]): CommunityPostSummary {
    const parsed = this.parseStoredContent(row.content);
    const normalizedMediaUrls = mediaUrls.map((url) => url.trim()).filter(Boolean);
    const mediaUrl = normalizedMediaUrls[0] ?? parsed.mediaUrl;

    return {
      post_id: row.post_id,
      user_id: row.user_id,
      title: row.title,
      content: parsed.content,
      media_type: this.inferMediaType(row.type, normalizedMediaUrls, mediaUrl),
      media_url: mediaUrl,
      media_urls: normalizedMediaUrls,
      type: row.type,
      status: row.status,
      created_at: row.created_at,
    };
  }

  private normalizeMediaUrlInput(input: { mediaUrl?: string; mediaUrls?: string[] }): string[] {
    if (Array.isArray(input.mediaUrls) && input.mediaUrls.length) {
      return input.mediaUrls.map((url) => url.trim()).filter(Boolean);
    }

    const single = input.mediaUrl?.trim() ?? "";
    return single ? [single] : [];
  }

  private validateAttachmentSelection(files: File[]): void {
    if (!files.length) {
      throw new AppError("At least one file is required", 400);
    }

    const imageCount = files.filter((file) => file.type.startsWith("image/")).length;
    const videoCount = files.filter((file) => file.type.startsWith("video/")).length;
    const unknownCount = files.length - imageCount - videoCount;

    if (unknownCount > 0) {
      throw new AppError("Only image and video files are supported", 400);
    }

    if (videoCount > 1) {
      throw new AppError("Only one video is allowed", 400);
    }

    if (videoCount === 1 && imageCount > 0) {
      throw new AppError("Cannot mix video with images in one post", 400);
    }
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

    const mediaType = input.mediaType?.trim() ?? "";
    const postType = input.type?.trim()
      ? this.mediaStrategy.normalizePostType(input.type)
      : this.mediaStrategy.toPostType(this.mediaStrategy.normalize(mediaType));
    const title = (input.title ?? "").trim() || "Community Post";

    let created: {
      post_id: string;
      user_id: string;
      type: CommunityPostType;
      status: "pending";
      created_at: string;
    };

    try {
      created = await this.repository.createPost({
        userId: input.userId.trim(),
        title,
        content: this.formatContentWithMedia(content),
        type: postType,
      });

      const mediaUrls = this.normalizeMediaUrlInput(input);
      if (mediaUrls.length) {
        await this.repository.replacePostMedia(created.post_id, mediaUrls);
      }
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
      type: CommunityPostType;
      status: "pending" | "approved" | "rejected";
      created_at: string;
    }>;

    try {
      rows = await this.repository.getPostsByUserId(userId.trim());
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load posts", 500);
    }

    let mediaByPostId: Record<string, string[]> = {};
    try {
      mediaByPostId = await this.repository.listMediaByPostIds(rows.map((row) => row.post_id));
    } catch {
      mediaByPostId = {};
    }

    return rows.map((row) => this.toSummary(row, mediaByPostId[row.post_id] ?? []));
  }

  async listAllPosts(): Promise<CommunityPostSummary[]> {
    let rows: Array<{
      post_id: string;
      user_id: string;
      title: string;
      content: string;
      type: CommunityPostType;
      status: "pending" | "approved" | "rejected";
      created_at: string;
    }>;

    try {
      rows = await this.repository.getAllPosts();
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load posts", 500);
    }

    let mediaByPostId: Record<string, string[]> = {};
    try {
      mediaByPostId = await this.repository.listMediaByPostIds(rows.map((row) => row.post_id));
    } catch {
      mediaByPostId = {};
    }

    return rows.map((row) => this.toSummary(row, mediaByPostId[row.post_id] ?? []));
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

    const mediaType = input.mediaType?.trim() ?? "";
    const postType = input.type?.trim()
      ? this.mediaStrategy.normalizePostType(input.type)
      : this.mediaStrategy.toPostType(this.mediaStrategy.normalize(mediaType));
    const title = (input.title ?? "").trim() || "Community Post";

    let updated: {
      post_id: string;
      user_id: string;
      title: string;
      content: string;
      type: CommunityPostType;
      status: "pending" | "approved" | "rejected";
      created_at: string;
    } | null;

    try {
      updated = await this.repository.updatePost({
        postId: input.postId.trim(),
        userId: input.userId.trim(),
        title,
        content: this.formatContentWithMedia(content),
        type: postType,
      });

      const mediaUrls = this.normalizeMediaUrlInput(input);
      if (input.mediaUrls !== undefined || input.mediaUrl !== undefined) {
        await this.repository.replacePostMedia(input.postId.trim(), mediaUrls);
      }
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to update post", 500);
    }

    if (!updated) {
      throw new AppError("Post not found for this user", 404);
    }

    let mediaByPostId: Record<string, string[]> = {};
    try {
      mediaByPostId = await this.repository.listMediaByPostIds([updated.post_id]);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load post media", 500);
    }

    return this.toSummary(updated, mediaByPostId[updated.post_id] ?? []);
  }

  async deletePost(input: DeleteCommunityPostInput): Promise<void> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (!input.postId.trim()) {
      throw new AppError("postId is required", 400);
    }

    let deleted = false;
    try {
      deleted = await this.repository.deletePost({
        postId: input.postId.trim(),
        userId: input.userId.trim(),
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to delete post", 500);
    }

    if (!deleted) {
      throw new AppError("Post not found for this user", 404);
    }
  }

  async uploadAttachment(input: UploadCommunityAttachmentInput): Promise<UploadCommunityAttachmentResult> {
    const userId = input.userId.trim();
    const postId = input.postId.trim();

    if (!userId || !postId) {
      throw new AppError("userId and postId are required", 400);
    }

    if (!Array.isArray(input.files) || !input.files.length) {
      throw new AppError("files are required", 400);
    }

    this.validateAttachmentSelection(input.files);

    let hasOwnership = false;
    try {
      hasOwnership = await this.repository.hasPostOwnership(postId, userId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to verify post ownership", 500);
    }

    if (!hasOwnership) {
      throw new AppError("Post not found for this user", 404);
    }

    const uploadedItems: Array<{ path: string; publicUrl: string }> = [];
    try {
      for (const file of input.files) {
        const path = this.attachmentStrategy.buildObjectPath(userId, postId, file.name || "attachment.bin");
        await this.repository.uploadAttachment(path, file);
        uploadedItems.push({
          path,
          publicUrl: this.repository.getAttachmentPublicUrl(path),
        });
      }

      if (input.replaceExisting ?? true) {
        await this.repository.replacePostMedia(postId, uploadedItems.map((item) => item.publicUrl));
      }
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to upload attachment", 400);
    }

    return {
      items: uploadedItems,
      mediaUrls: uploadedItems.map((item) => item.publicUrl),
    };
  }
}

export const communityPostService = new CommunityPostService();
