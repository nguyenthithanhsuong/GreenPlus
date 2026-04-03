export type BlogStatus = "pending" | "approved" | "rejected" | "published";

export type BlogSummary = {
  post_id: string;
  title: string;
  status: BlogStatus;
  created_at: string;
  excerpt: string;
  image_url: string | null;
};

export type BlogDetail = {
  post_id: string;
  title: string;
  content: string;
  status: BlogStatus;
  created_at: string;
  user_id: string;
  image_url: string | null;
};

export type BlogViewedEvent = {
  postId: string;
  event: "viewed";
  viewedAt: string;
};
