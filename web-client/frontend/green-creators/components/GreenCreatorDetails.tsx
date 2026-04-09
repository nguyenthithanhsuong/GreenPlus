"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type CommunityPostItem = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  media_type: "JPG" | "PNG" | "MP4";
  media_url: string | null;
  media_urls?: string[];
  type: "community" | "video";
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type ProfileResult = {
  user_id: string;
  name: string;
  image_url: string | null;
};

type CommunityPostInteractionItem = {
  interaction_id: string;
  post_id: string;
  user_id: string;
  type: "like" | "comment";
  comment: string | null;
  created_at: string;
  status: string | null;
};

type GreenCreatorDetailsProps = {
  postId: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    position: "relative",
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    fontFamily: "'Inter', sans-serif",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
  topNav: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  iconButton: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1E1E1E",
    textDecoration: "none",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #EDEDED",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  postHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  avatarPlaceholder: {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    background: "#E6E6E6",
  },
  authorName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  statusChip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  mediaScroller: {
    position: "relative",
  },
  mediaViewport: {
    overflow: "hidden",
    borderRadius: "12px",
  },
  mediaTrack: {
    display: "flex",
    transition: "transform 0.28s ease",
    willChange: "transform",
  },
  mediaSlide: {
    height: "220px",
    background: "#F0F2F5",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  mediaVideo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    background: "#000000",
  },
  mediaIndicators: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  mediaDot: {
    border: "none",
    width: "6px",
    height: "6px",
    borderRadius: "999px",
    background: "#B6B6B6",
    padding: 0,
    cursor: "pointer",
  },
  mediaDotActive: {
    background: "#11A94D",
  },
  mediaArrowButton: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    border: "none",
    background: "rgba(17, 24, 39, 0.72)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2,
  },
  mediaArrowLeft: {
    left: "10px",
  },
  mediaArrowRight: {
    right: "10px",
  },
  postDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  caption: {
    fontSize: "13px",
    color: "#1E1E1E",
    lineHeight: "18px",
  },
  boldText: {
    fontWeight: 700,
  },
  dateText: {
    fontSize: "12px",
    color: "#8A8A8A",
  },
  helperText: {
    margin: 0,
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: "18px",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  actionGroupLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  actionButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  likedIcon: {
    stroke: "#E11D48",
    fill: "#E11D48",
  },
  likeCount: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  commentsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  commentRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    fontSize: "13px",
    color: "#1E1E1E",
  },
  commentText: {
    flex: 1,
    lineHeight: "18px",
  },
  likedComment: {
    color: "#51B788",
    fontWeight: 700,
  },
  commentCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#F9FAFB",
  },
  commentHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  commentAuthorWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  commentAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    background: "#E6E6E6",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  commentMeta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
    flexWrap: "wrap",
  },
  commentAuthorName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#111827",
  },
  commentTime: {
    fontSize: "11px",
    color: "#6B7280",
  },
  commentTextBody: {
    fontSize: "13px",
    lineHeight: "18px",
    color: "#1E1E1E",
    margin: 0,
  },
  commentTextEdited: {
    fontSize: "11px",
    color: "#6B7280",
  },
  commentActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  commentActionButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: "12px",
    fontWeight: 700,
    color: "#11A94D",
    cursor: "pointer",
  },
  commentActionDanger: {
    color: "#B91C1C",
  },
  commentEditor: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  commentInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  commentInput: {
    flex: 1,
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    outline: "none",
  },
  sendBtn: {
    border: "none",
    background: "#11A94D",
    color: "#FFFFFF",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

function toStatusStyle(status: CommunityPostItem["status"]): React.CSSProperties {
  if (status === "approved") {
    return { ...styles.statusChip, color: "#065F46", background: "#D1FAE5" };
  }

  if (status === "rejected") {
    return { ...styles.statusChip, color: "#991B1B", background: "#FEE2E2" };
  }

  return { ...styles.statusChip, color: "#92400E", background: "#FEF3C7" };
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Ngày không xác định";
  }

  return parsed.toLocaleString("vi-VN");
}

function getMediaItems(post: CommunityPostItem): string[] {
  const items = (post.media_urls ?? []).map((url) => url.trim()).filter(Boolean);
  const fallback = post.media_url?.trim() ?? "";

  if (!items.length && fallback) {
    return [fallback];
  }

  return items;
}

function isVideoUrl(url: string, mediaType: CommunityPostItem["media_type"]): boolean {
  const normalized = url.toLowerCase();
  return mediaType === "MP4" || normalized.endsWith(".mp4") || normalized.includes(".mp4?");
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "GC";
  }

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function GreenCreatorDetails({ postId }: GreenCreatorDetailsProps) {
  const [allPosts, setAllPosts] = useState<CommunityPostItem[]>([]);
  const [profileByUserId, setProfileByUserId] = useState<Record<string, ProfileResult>>({});
  const [interactions, setInteractions] = useState<CommunityPostInteractionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");
  const [interactionBusy, setInteractionBusy] = useState(false);

  const currentUserId = useAuthStore((state) => state.user?.user_id ?? "");

  const post = useMemo(() => allPosts.find((item) => item.post_id === postId) ?? null, [allPosts, postId]);
  const authorProfile = post ? profileByUserId[post.user_id] : null;
  const authorName = authorProfile?.name ?? (post?.user_id ? `Creator ${post.user_id.slice(0, 6)}` : "Green Creator");
  const authorAvatar = authorProfile?.image_url ?? "";
  const mediaItems = useMemo(() => (post ? getMediaItems(post) : []), [post]);
  const visibleComments = useMemo(
    () =>
      interactions
        .filter((item) => item.type === "comment" && item.status !== "deleted")
        .sort((left, right) => left.created_at.localeCompare(right.created_at)),
    [interactions]
  );
  const likeCount = useMemo(() => interactions.filter((item) => item.type === "like").length, [interactions]);
  const liked = useMemo(
    () => Boolean(currentUserId && interactions.some((item) => item.type === "like" && item.user_id === currentUserId)),
    [currentUserId, interactions]
  );

  const fetchInteractions = async (signal?: AbortSignal) => {
    if (!postId) {
      return;
    }

    const response = await fetch(`/api/community/posts/interactions?postId=${encodeURIComponent(postId)}`, {
      signal,
    });
    const data = (await response.json()) as { items?: CommunityPostInteractionItem[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Failed to load interactions");
    }

    setInteractions(Array.isArray(data.items) ? data.items : []);
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadPosts = async () => {
      if (!postId) {
        setError("Missing post ID");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/community/posts?scope=all", {
          signal: controller.signal,
        });
        const data = (await response.json()) as CommunityPostItem[] | { error: string };

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(!Array.isArray(data) && "error" in data ? data.error : "Failed to load posts");
        }

        setAllPosts(data);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Unexpected error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      controller.abort();
    };
  }, [postId]);

  useEffect(() => {
    setNewComment("");
    setEditingCommentId(null);
    setEditingCommentValue("");
    setActiveMediaIndex(0);
  }, [postId, post]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    const controller = new AbortController();

    const loadInteractions = async () => {
      setInteractionError(null);

      try {
        await fetchInteractions(controller.signal);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setInteractionError(requestError instanceof Error ? requestError.message : "Unexpected error");
        setInteractions([]);
      }
    };

    void loadInteractions();

    return () => {
      controller.abort();
    };
  }, [postId]);

  useEffect(() => {
    const uniqueUserIds = Array.from(new Set(allPosts.map((item) => item.user_id).filter(Boolean)));
    if (!uniqueUserIds.length) {
      setProfileByUserId({});
      return;
    }

    const controller = new AbortController();

    const loadProfiles = async () => {
      try {
        const profiles = await Promise.all(
          uniqueUserIds.map(async (userIdToLoad) => {
            const response = await fetch(`/api/account/profile?userId=${encodeURIComponent(userIdToLoad)}`, {
              signal: controller.signal,
            });

            if (!response.ok) {
              return null;
            }

            const data = (await response.json()) as ProfileResult | { error?: string };
            if (!data || typeof data !== "object" || !("user_id" in data) || !("name" in data)) {
              return null;
            }

            return data as ProfileResult;
          })
        );

        if (controller.signal.aborted) {
          return;
        }

        const nextProfiles: Record<string, ProfileResult> = {};
        for (const profile of profiles) {
          if (profile) {
            nextProfiles[profile.user_id] = profile;
          }
        }

        setProfileByUserId(nextProfiles);
      } catch {
        if (!controller.signal.aborted) {
          setProfileByUserId({});
        }
      }
    };

    void loadProfiles();

    return () => {
      controller.abort();
    };
  }, [allPosts, interactions]);

  const handleShare = async () => {
    if (!post) {
      return;
    }

    const shareUrl = `${window.location.origin}/green-creators/${post.post_id}`;
    const shareText = `${authorName}: ${post.title}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      }
    } catch {
      // user cancelled
    }
  };

  const refreshInteractions = async () => {
    await fetchInteractions();
  };

  const handleToggleLike = async () => {
    if (!post || !currentUserId || interactionBusy) {
      return;
    }

    setInteractionBusy(true);
    setInteractionError(null);

    try {
      if (liked) {
        const response = await fetch("/api/community/posts/interactions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: post.post_id,
            userId: currentUserId,
            type: "like",
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Không thể bỏ thích bài đăng.");
        }
      } else {
        const response = await fetch("/api/community/posts/interactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: post.post_id,
            userId: currentUserId,
            type: "like",
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Không thể thích bài đăng.");
        }
      }

      await refreshInteractions();
    } catch (requestError) {
      setInteractionError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setInteractionBusy(false);
    }
  };

  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!post || !currentUserId || !trimmed || interactionBusy) {
      return;
    }

    setInteractionBusy(true);
    setInteractionError(null);

    try {
      const response = await fetch("/api/community/posts/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.post_id,
          userId: currentUserId,
          type: "comment",
          comment: trimmed,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Không thể gửi bình luận.");
      }

      setNewComment("");
      await refreshInteractions();
    } catch (requestError) {
      setInteractionError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setInteractionBusy(false);
    }
  };

  const handleStartEditComment = (comment: CommunityPostInteractionItem) => {
    setEditingCommentId(comment.interaction_id);
    setEditingCommentValue(comment.comment ?? "");
  };

  const handleSaveCommentEdit = async (comment: CommunityPostInteractionItem) => {
    const trimmed = editingCommentValue.trim();
    if (!currentUserId || !trimmed || interactionBusy) {
      return;
    }

    setInteractionBusy(true);
    setInteractionError(null);

    try {
      const response = await fetch("/api/community/posts/interactions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interactionId: comment.interaction_id,
          userId: currentUserId,
          comment: trimmed,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Không thể cập nhật bình luận.");
      }

      setEditingCommentId(null);
      setEditingCommentValue("");
      await refreshInteractions();
    } catch (requestError) {
      setInteractionError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setInteractionBusy(false);
    }
  };

  const handleDeleteComment = async (comment: CommunityPostInteractionItem) => {
    if (!currentUserId || interactionBusy) {
      return;
    }

    setInteractionBusy(true);
    setInteractionError(null);

    try {
      const response = await fetch("/api/community/posts/interactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interactionId: comment.interaction_id,
          userId: currentUserId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Không thể xóa bình luận.");
      }

      if (editingCommentId === comment.interaction_id) {
        setEditingCommentId(null);
        setEditingCommentValue("");
      }

      await refreshInteractions();
    } catch (requestError) {
      setInteractionError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setInteractionBusy(false);
    }
  };

  const currentUserProfile = currentUserId ? profileByUserId[currentUserId] : null;

  const getProfileName = (userIdValue: string): string => {
    const profile = profileByUserId[userIdValue];
    return profile?.name ?? (userIdValue === currentUserId ? currentUserProfile?.name ?? "Bạn" : `Creator ${userIdValue.slice(0, 6)}`);
  };

  const getProfileAvatar = (userIdValue: string): string => {
    return profileByUserId[userIdValue]?.image_url ?? "";
  };

  const getCommentDate = (value: string): string => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (mediaItems.length > 0 && activeMediaIndex >= mediaItems.length) {
      setActiveMediaIndex(0);
    }
  }, [activeMediaIndex, mediaItems.length]);

  const goToPreviousMedia = () => {
    if (mediaItems.length <= 1) {
      return;
    }

    setActiveMediaIndex((current) => (current === 0 ? mediaItems.length - 1 : current - 1));
  };

  const goToNextMedia = () => {
    if (mediaItems.length <= 1) {
      return;
    }

    setActiveMediaIndex((current) => (current + 1 >= mediaItems.length ? 0 : current + 1));
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href="/green-creators" style={styles.iconButton} aria-label="Quay lại danh sách bài đăng">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.title}>Chi tiết bài đăng</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          {loading ? <p style={styles.helperText}>Đang tải bài đăng...</p> : null}
          {error ? <p style={{ ...styles.helperText, color: "#B91C1C", fontWeight: 700 }}>{error}</p> : null}

          {post ? (
            <article style={styles.card}>
              <div style={styles.postHeader}>
                <div style={styles.authorInfo}>
                  <div style={styles.avatarPlaceholder}>
                    {authorAvatar ? (
                      <img src={authorAvatar} alt={authorName} style={{ width: "100%", height: "100%", borderRadius: "999px", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280" }}>{getInitials(authorName)}</span>
                    )}
                  </div>
                  <span style={styles.authorName}>{authorName}</span>
                </div>
                <span style={toStatusStyle(post.status)}>{post.status}</span>
              </div>

              <div>
                <div style={styles.mediaScroller}>
                  <div style={styles.mediaViewport}>
                    <div
                      style={{
                        ...styles.mediaTrack,
                        width: `${Math.max(mediaItems.length, 1) * 100}%`,
                        transform: `translateX(-${activeMediaIndex * (100 / Math.max(mediaItems.length, 1))}%)`,
                      }}
                    >
                      {mediaItems.length ? (
                        mediaItems.map((mediaUrl, index) => {
                          const video = isVideoUrl(mediaUrl, post.media_type);

                          return (
                            <div
                              key={`${post.post_id}-${index}-${mediaUrl}`}
                              style={{
                                ...styles.mediaSlide,
                                flex: `0 0 ${100 / mediaItems.length}%`,
                                minWidth: `${100 / mediaItems.length}%`,
                              }}
                            >
                              {video ? (
                                <video src={mediaUrl} controls playsInline preload="metadata" style={styles.mediaVideo} />
                              ) : (
                                <img src={mediaUrl} alt={`${post.title} ${index + 1}`} style={styles.mediaImage} />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            ...styles.mediaSlide,
                            flex: "0 0 100%",
                            minWidth: "100%",
                          }}
                        >
                          <div style={{ ...styles.helperText, textAlign: "center" }}>Không có media</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {mediaItems.length > 1 ? (
                    <>
                      <button type="button" style={{ ...styles.mediaArrowButton, ...styles.mediaArrowLeft }} onClick={goToPreviousMedia} aria-label="Xem media trước">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button type="button" style={{ ...styles.mediaArrowButton, ...styles.mediaArrowRight }} onClick={goToNextMedia} aria-label="Xem media tiếp theo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </>
                  ) : null}
                </div>

                {mediaItems.length > 1 ? (
                  <div style={styles.mediaIndicators}>
                    {mediaItems.map((_, index) => (
                      <button
                        key={`indicator-${index}`}
                        style={{
                          ...styles.mediaDot,
                          ...(index === activeMediaIndex ? styles.mediaDotActive : {}),
                        }}
                        onClick={() => setActiveMediaIndex(index)}
                        aria-label={`Xem media ${index + 1}`}
                        type="button"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={styles.postDetails}>
                <div style={styles.caption}>
                  <span style={styles.boldText}>{post.title}</span>
                </div>
                <div style={styles.caption}>{post.content || "Không có nội dung"}</div>
                <div style={styles.dateText}>{formatDate(post.created_at)}</div>
              </div>

              <div style={styles.actionRow}>
                <div style={styles.actionGroupLeft}>
                  <button type="button" style={styles.actionButton} onClick={() => void handleToggleLike()} aria-label="Thích bài đăng">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2">
                      <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                        style={liked ? styles.likedIcon : undefined}
                      />
                    </svg>
                  </button>
                  <button type="button" style={styles.actionButton} onClick={handleShare} aria-label="Chia sẻ bài đăng">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
                <div style={styles.likeCount}>
                  {likeCount} lượt thích
                </div>
              </div>

              <div style={styles.commentsSection}>
                {interactionError ? <p style={{ ...styles.helperText, color: "#B91C1C", fontWeight: 700 }}>{interactionError}</p> : null}

                {visibleComments.map((comment) => {
                  const isOwnComment = comment.user_id === currentUserId;
                  const isEditing = editingCommentId === comment.interaction_id;
                  const profileName = getProfileName(comment.user_id);
                  const profileAvatar = getProfileAvatar(comment.user_id);

                  return (
                    <div key={comment.interaction_id} style={styles.commentCard}>
                      <div style={styles.commentHeader}>
                        <div style={styles.commentAuthorWrap}>
                          <div style={styles.commentAvatar}>
                            {profileAvatar ? (
                              <img src={profileAvatar} alt={profileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "#6B7280" }}>{getInitials(profileName)}</span>
                            )}
                          </div>
                          <div style={styles.commentMeta}>
                            <span style={styles.commentAuthorName}>{profileName}</span>
                            <span style={styles.commentTime}>{getCommentDate(comment.created_at)}</span>
                            {comment.status === "edited" ? <span style={styles.commentTextEdited}>(đã chỉnh sửa)</span> : null}
                          </div>
                        </div>

                        {isOwnComment ? (
                          <div style={styles.commentActions}>
                            <button type="button" style={styles.commentActionButton} onClick={() => handleStartEditComment(comment)}>
                              Sửa
                            </button>
                            <button
                              type="button"
                              style={{ ...styles.commentActionButton, ...styles.commentActionDanger }}
                              onClick={() => void handleDeleteComment(comment)}
                            >
                              Xóa
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {isEditing ? (
                        <div style={styles.commentEditor}>
                          <textarea
                            value={editingCommentValue}
                            onChange={(event) => setEditingCommentValue(event.target.value)}
                            rows={3}
                            style={styles.commentInput}
                          />
                          <div style={styles.commentInputRow}>
                            <button type="button" style={styles.sendBtn} onClick={() => void handleSaveCommentEdit(comment)}>
                              Lưu
                            </button>
                            <button
                              type="button"
                              style={{ ...styles.sendBtn, background: "#E5E7EB", color: "#111827" }}
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentValue("");
                              }}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={styles.commentTextBody}>{comment.comment ?? ""}</p>
                      )}
                    </div>
                  );
                })}

                <div style={styles.commentInputRow}>
                  <input
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder={currentUserId ? "Viết bình luận..." : "Đăng nhập để bình luận"}
                    style={styles.commentInput}
                    disabled={!currentUserId || interactionBusy}
                  />
                  <button type="button" style={styles.sendBtn} onClick={() => void handleAddComment()} disabled={!currentUserId || interactionBusy}>
                    Gửi
                  </button>
                </div>
              </div>
            </article>
          ) : null}

          {!loading && !error && !post ? <p style={styles.helperText}>Không tìm thấy bài đăng.</p> : null}
        </main>

        <NavigationBar />
      </div>
    </main>
  );
}
