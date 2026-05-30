export type GreenCreatorPostStatus = "pending" | "approved" | "rejected";

export type GreenCreatorPostType = "blog" | "video" | "community";

export type GreenCreatorMediaRow = {
  media_id: string;
  media_url: string | null;
};

export type GreenCreatorInteractionRow = {
  interaction_id: string;
  post_id: string | null;
  user_id: string | null;
  user_name: string | null;
  user_image_url: string | null;
  type: string;
  comment: string | null;
  created_at: string | null;
  status: string | null;
};

export type GreenCreatorPostRow = {
  post_id: string;
  user_id: string | null;
  author_name: string | null;
  author_image_url: string | null;
  title: string;
  content: string;
  type: GreenCreatorPostType;
  status: GreenCreatorPostStatus;
  created_at: string | null;
  media: GreenCreatorMediaRow[];
  interactions: GreenCreatorInteractionRow[];
  media_count: number;
  interaction_count: number;
  comment_count: number;
};

export type CreateGreenCreatorPostInput = {
  userId: string;
  title?: string;
  content: string;
  type?: GreenCreatorPostType;
};

export type UploadGreenCreatorAttachmentInput = {
  userId: string;
  postId: string;
  files: File[];
  replaceExisting?: boolean;
};

export type UploadGreenCreatorAttachmentResult = {
  items: Array<{
    path: string;
    publicUrl: string;
  }>;
  mediaUrls: string[];
};