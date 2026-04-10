export type CommunityPostStatus = "pending" | "approved" | "rejected";

export type CommunityMediaType = "JPG" | "PNG" | "MP4";
export type CommunityPostType = "blog" | "video" | "community";

export type CreateCommunityPostInput = {
  userId: string;
  title?: string;
  content: string;
  mediaType?: string;
  type?: CommunityPostType;
  mediaUrl?: string;
  mediaUrls?: string[];
};

export type CommunityPostCreatedResult = {
  post_id: string;
  user_id: string;
  type: CommunityPostType;
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
  media_urls: string[];
  type: CommunityPostType;
  status: CommunityPostStatus;
  created_at: string;
};

export type UpdateCommunityPostInput = {
  userId: string;
  postId: string;
  title?: string;
  content: string;
  mediaType?: string;
  type?: CommunityPostType;
  mediaUrl?: string;
  mediaUrls?: string[];
};

export type DeleteCommunityPostInput = {
  userId: string;
  postId: string;
};

export type CommunityPostChangedEvent = {
  postId: string;
  event: "created" | "updated" | "deleted";
  changedAt: string;
};

export type UploadCommunityAttachmentInput = {
  userId: string;
  postId: string;
  files: File[];
  replaceExisting?: boolean;
};

export type UploadCommunityAttachmentResult = {
  items: Array<{
    path: string;
    publicUrl: string;
  }>;
  mediaUrls: string[];
};

export type CommunityPostInteractionType = "like" | "comment" | "bookmark";
export type CommunityPostInteractionStatus = "active" | "edited" | "deleted";

export type CommunityPostInteraction = {
  interaction_id: string;
  post_id: string;
  user_id: string;
  type: CommunityPostInteractionType;
  comment: string | null;
  created_at: string;
  status: CommunityPostInteractionStatus | null;
};

export type CommunityPostInteractionSummary = CommunityPostInteraction;

export type CreateCommunityPostInteractionInput = {
  postId: string;
  userId: string;
  type: CommunityPostInteractionType;
  comment?: string;
};

export type UpdateCommunityPostInteractionInput = {
  interactionId: string;
  userId: string;
  comment: string;
};

export type DeleteCommunityPostInteractionInput = {
  interactionId?: string;
  postId?: string;
  userId: string;
  type?: CommunityPostInteractionType;
};
