import { AppError } from "../../core/errors";
import { GreenCreatorContentRepository } from "./greencreator-content.repository";
import { GreenCreatorPostRow, GreenCreatorPostStatus } from "./greencreator-content.types";

export class GreenCreatorContentService {
  constructor(private readonly repository: GreenCreatorContentRepository) {}

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
}
