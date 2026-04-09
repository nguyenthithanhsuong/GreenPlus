import { AppError } from "../../core/errors";
import {
  CreateCommunityPostInteractionInput,
  DeleteCommunityPostInteractionInput,
  CommunityPostInteractionSummary,
  UpdateCommunityPostInteractionInput,
} from "./community-post.types";
import { CommunityPostInteractionRepository, toCommunityPostInteractionSummary } from "./community-post-interaction.repository";

export class CommunityPostInteractionService {
  private readonly repository = new CommunityPostInteractionRepository();

  async listByPostId(postId: string): Promise<CommunityPostInteractionSummary[]> {
    if (!postId.trim()) {
      throw new AppError("postId is required", 400);
    }

    const rows = await this.repository.listByPostId(postId.trim());
    return rows.map(toCommunityPostInteractionSummary);
  }

  async addInteraction(input: CreateCommunityPostInteractionInput): Promise<CommunityPostInteractionSummary | null> {
    const postId = input.postId.trim();
    const userId = input.userId.trim();

    if (!postId || !userId) {
      throw new AppError("postId and userId are required", 400);
    }

    if (input.type === "like") {
      const existing = await this.repository.findLike(postId, userId);
      if (existing) {
        return toCommunityPostInteractionSummary(existing);
      }

      const created = await this.repository.create({
        postId,
        userId,
        type: "like",
        status: "active",
      });

      return toCommunityPostInteractionSummary(created);
    }

    const comment = (input.comment ?? "").trim();
    if (!comment) {
      throw new AppError("comment is required", 400);
    }

    const created = await this.repository.create({
      postId,
      userId,
      type: "comment",
      comment,
      status: "active",
    });

    return toCommunityPostInteractionSummary(created);
  }

  async editComment(input: UpdateCommunityPostInteractionInput): Promise<CommunityPostInteractionSummary> {
    if (!input.interactionId.trim() || !input.userId.trim()) {
      throw new AppError("interactionId and userId are required", 400);
    }

    const comment = input.comment.trim();
    if (!comment) {
      throw new AppError("comment is required", 400);
    }

    const updated = await this.repository.updateComment({
      interactionId: input.interactionId.trim(),
      userId: input.userId.trim(),
      comment,
    });

    if (!updated) {
      throw new AppError("Comment not found", 404);
    }

    return toCommunityPostInteractionSummary(updated);
  }

  async deleteInteraction(input: DeleteCommunityPostInteractionInput): Promise<{ success: true }> {
    const userId = input.userId.trim();
    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    if (input.type === "like") {
      if (!input.postId?.trim()) {
        throw new AppError("postId is required", 400);
      }

      await this.repository.deleteLike({ postId: input.postId.trim(), userId });
      return { success: true };
    }

    if (!input.interactionId?.trim()) {
      throw new AppError("interactionId is required", 400);
    }

    const deleted = await this.repository.markCommentDeleted({
      interactionId: input.interactionId.trim(),
      userId,
    });

    if (!deleted) {
      throw new AppError("Comment not found", 404);
    }

    return { success: true };
  }
}

export const communityPostInteractionService = new CommunityPostInteractionService();