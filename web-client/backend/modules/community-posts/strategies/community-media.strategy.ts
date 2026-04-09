import { AppError } from "../../../core/errors";
import { CommunityPostType } from "../community-post.types";

export interface CommunityMediaStrategy {
  normalize(mediaType: string): "JPG" | "PNG" | "MP4";
  toPostType(mediaType: "JPG" | "PNG" | "MP4"): CommunityPostType;
  normalizePostType(type: string): CommunityPostType;
}

class DefaultCommunityMediaStrategy implements CommunityMediaStrategy {
  normalize(mediaType: string): "JPG" | "PNG" | "MP4" {
    const normalized = mediaType.trim().toUpperCase();
    if (normalized !== "JPG" && normalized !== "PNG" && normalized !== "MP4") {
      throw new AppError("media_type must be one of: JPG, PNG, MP4", 400);
    }

    return normalized;
  }

  toPostType(mediaType: "JPG" | "PNG" | "MP4"): CommunityPostType {
    if (mediaType === "MP4") {
      return "video";
    }

    return "community";
  }

  normalizePostType(type: string): CommunityPostType {
    const normalized = type.trim().toLowerCase();
    if (normalized !== "blog" && normalized !== "video" && normalized !== "community") {
      throw new AppError("type must be one of: blog, video, community", 400);
    }

    return normalized;
  }
}

export function createCommunityMediaStrategy(): CommunityMediaStrategy {
  return new DefaultCommunityMediaStrategy();
}
