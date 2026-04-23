import { AppError } from "../../../core/errors";

export interface ProfileImageStorageStrategy {
  buildObjectPath(userId: string, originalName: string): string;
}

class TimestampProfileImageStorageStrategy implements ProfileImageStorageStrategy {
  buildObjectPath(userId: string, originalName: string): string {
    const safeUserId = userId.trim();

    if (!safeUserId) {
      throw new AppError("userId is required", 400);
    }

    const normalizedName = originalName.trim() || "profile-image.jpg";
    const ext = normalizedName.includes(".") ? normalizedName.split(".").pop() ?? "jpg" : "jpg";
    const randomPart = Math.random().toString(16).slice(2);
    const timestamp = Date.now();

    return `${safeUserId}/${timestamp}-${randomPart}.${ext}`;
  }
}

export function createProfileImageStorageStrategy(): ProfileImageStorageStrategy {
  return new TimestampProfileImageStorageStrategy();
}
