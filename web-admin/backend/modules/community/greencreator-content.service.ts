import { AppError } from "../../core/errors";
import { GreenCreatorContentRepository } from "./greencreator-content.repository";
import {
  CreateGreenCreatorPostInput,
  GreenCreatorPostRow,
  GreenCreatorPostStatus,
  UploadGreenCreatorAttachmentInput,
  UploadGreenCreatorAttachmentResult,
} from "./greencreator-content.types";

export class GreenCreatorContentService {
  constructor(private readonly repository: GreenCreatorContentRepository) {}

  private static readonly MAX_CONTENT_LENGTH = 1000;

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

  private buildAttachmentPath(userId: string, postId: string, originalName: string): string {
    const safeUserId = userId.trim();
    const safePostId = postId.trim();

    if (!safeUserId || !safePostId) {
      throw new AppError("userId and postId are required", 400);
    }

    const normalizedName = originalName.trim() || "attachment.bin";
    const ext = normalizedName.includes(".") ? normalizedName.split(".").pop() ?? "bin" : "bin";
    const randomPart = Math.random().toString(16).slice(2);
    const timestamp = Date.now();

    return `${safeUserId}/${safePostId}/${timestamp}-${randomPart}.${ext}`;
  }

  async listPosts(): Promise<GreenCreatorPostRow[]> {
    return this.repository.listPosts();
  }

  async changeStatus(postId: string, status: GreenCreatorPostStatus): Promise<GreenCreatorPostRow> {
    if (!postId.trim()) {
      throw new AppError("postId is required", 400);
    }

    const existing = await this.repository.findPostById(postId);
    if (!existing) {
      throw new AppError("Post not found", 404);
    }

    const updated = await this.repository.updatePostStatus({ postId, status });
    if (!updated) {
      throw new AppError("Post not found", 404);
    }

    return updated;
  }

  async createPost(input: CreateGreenCreatorPostInput): Promise<GreenCreatorPostRow> {
    const userId = input.userId.trim();
    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    const content = input.content.trim();
    if (!content) {
      throw new AppError("content is required", 400);
    }

    if (content.length > GreenCreatorContentService.MAX_CONTENT_LENGTH) {
      throw new AppError("content must not exceed 1000 characters", 400);
    }

    const title = (input.title ?? "").trim() || "Community Post";
    const type = input.type ?? "community";

    const created = await this.repository.createPost({
      userId,
      title,
      content,
      type,
    });

    const createdPost = await this.repository.findPostById(created.post_id);
    if (!createdPost) {
      throw new AppError("Post not found", 404);
    }

    return createdPost;
  }

  async deletePost(postId: string, force = false): Promise<void> {
    if (!postId.trim()) {
      throw new AppError("postId is required", 400);
    }

    const normalizedPostId = postId.trim();
    const deleted = force
      ? await this.repository.deletePostWithRelations(normalizedPostId)
      : await this.repository.deletePost(normalizedPostId);
    if (!deleted) {
      throw new AppError("Post not found", 404);
    }
  }

  async uploadAttachment(input: UploadGreenCreatorAttachmentInput): Promise<UploadGreenCreatorAttachmentResult> {
    const userId = input.userId.trim();
    const postId = input.postId.trim();

    if (!userId || !postId) {
      throw new AppError("userId and postId are required", 400);
    }

    if (!Array.isArray(input.files) || !input.files.length) {
      throw new AppError("files are required", 400);
    }

    this.validateAttachmentSelection(input.files);

    const hasOwnership = await this.repository.hasPostOwnership(postId, userId);
    if (!hasOwnership) {
      throw new AppError("Post not found for this user", 404);
    }

    const uploadedItems: Array<{ path: string; publicUrl: string }> = [];

    for (const file of input.files) {
      const path = this.buildAttachmentPath(userId, postId, file.name || "attachment.bin");
      await this.repository.uploadAttachment(path, file);
      uploadedItems.push({
        path,
        publicUrl: this.repository.getAttachmentPublicUrl(path),
      });
    }

    if (input.replaceExisting ?? true) {
      await this.repository.replacePostMedia(postId, uploadedItems.map((item) => item.publicUrl));
    }

    return {
      items: uploadedItems,
      mediaUrls: uploadedItems.map((item) => item.publicUrl),
    };
  }
}
