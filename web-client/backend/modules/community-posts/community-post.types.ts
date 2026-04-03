export type CommunityPostStatus = "pending" | "approved" | "rejected";

export type CommunityMediaType = "JPG" | "PNG" | "MP4";

export type CreateCommunityPostInput = {
  userId: string;
  title?: string;
  content: string;
  mediaType: string;
  mediaUrl?: string;
};

export type CommunityPostCreatedResult = {
  post_id: string;
  user_id: string;
  type: "community" | "video";
  status: CommunityPostStatus;
  created_at: string;
};

export type CommunityPostSummary = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  media_type: CommunityMediaType;
  media_url: string | null;
  type: "community" | "video";
  status: CommunityPostStatus;
  created_at: string;
};

export type UpdateCommunityPostInput = {
  userId: string;
  postId: string;
  title?: string;
  content: string;
  mediaType: string;
  mediaUrl?: string;
};

export type CommunityPostChangedEvent = {
  postId: string;
  event: "created" | "updated";
  changedAt: string;
};
