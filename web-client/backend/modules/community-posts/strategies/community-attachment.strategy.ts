import { AppError } from "../../../core/errors";

export interface CommunityAttachmentStrategy {
  buildObjectPath(userId: string, postId: string, originalName: string): string;
}

class TimestampAttachmentStrategy implements CommunityAttachmentStrategy {
  buildObjectPath(userId: string, postId: string, originalName: string): string {
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
}

export function createCommunityAttachmentStrategy(): CommunityAttachmentStrategy {
  return new TimestampAttachmentStrategy();
}
