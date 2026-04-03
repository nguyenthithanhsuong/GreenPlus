import { AppError } from "../../../core/errors";

export interface CommunityMediaStrategy {
  normalize(mediaType: string): "JPG" | "PNG" | "MP4";
  toPostType(mediaType: "JPG" | "PNG" | "MP4"): "community" | "video";
}

class DefaultCommunityMediaStrategy implements CommunityMediaStrategy {
  normalize(mediaType: string): "JPG" | "PNG" | "MP4" {
    const normalized = mediaType.trim().toUpperCase();
    if (normalized !== "JPG" && normalized !== "PNG" && normalized !== "MP4") {
      throw new AppError("media_type must be one of: JPG, PNG, MP4", 400);
    }

    return normalized;
  }

  toPostType(mediaType: "JPG" | "PNG" | "MP4"): "community" | "video" {
    if (mediaType === "MP4") {
      return "video";
    }

    return "community";
  }
}

export function createCommunityMediaStrategy(): CommunityMediaStrategy {
  return new DefaultCommunityMediaStrategy();
}
