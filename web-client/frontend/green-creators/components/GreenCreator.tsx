"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type Comment = {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
};

type Post = {
  id: string;
  postId: string;
  userId: string;
  title: string;
  content: string;
  mediaType: "JPG" | "PNG" | "MP4";
  type: "community" | "video" | "blog";
  status: "pending" | "approved" | "rejected";
  author: {
    name: string;
    avatar: string;
  };
  image: string;
  images: string[];
  likes: number;
  caption: string;
  comments: Comment[];
  date: string;
};

type CommunityPostItem = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  media_type: "JPG" | "PNG" | "MP4";
  media_url: string | null;
  media_urls?: string[];
  type: "community" | "video" | "blog";
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
  type: "like" | "comment" | "bookmark";
  comment: string | null;
  created_at: string;
  status: string | null;
};

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

// const fallbackPostsData: Post[] = [
//   {
//     id: "fallback-1",
//     postId: "fallback-1",
//     userId: "fallback-user",
//     title: "Community Post",
//     content: "Thử làm cơm đĩa giá dưới 50k!",
//     mediaType: "JPG",
//     type: "community",
//     status: "approved",
//     author: {
//       name: "Thanh Sương",
//       avatar: "/images/avatar1.png",
//     },
//     image: "/images/post-image1.png",
//     likes: 74,
//     caption: "Thử làm cơm đĩa giá dưới 50k!",
//     comments: [
//       { id: 1, username: "Hoàng Sơn", text: "Trông xịn thế", isLiked: true },
//       {
//         id: 2,
//         username: "thienduongofficial",
//         text: "Nhìn thôi đã thấy đói bụng rồi, khéo tay quá!",
//         isLiked: false,
//       },
//     ],
//     date: "Ngày 03 Tháng 03 Năm 2026",
//   },
// ];

function formatPostDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Ngày không xác định";
  }

  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mapCommunityPostToUi(item: CommunityPostItem, index: number): Post {
  const caption = (item.content ?? "").trim();
  const mediaItems = (item.media_urls ?? []).map((url) => url.trim()).filter(Boolean);
  const primaryMedia = mediaItems[0] || item.media_url || "";
  return {
    id: item.post_id || `post-${index + 1}`,
    postId: item.post_id,
    userId: item.user_id,
    title: item.title || "Community Post",
    content: item.content || "",
    mediaType: item.media_type,
    type: item.type,
    status: item.status,
    author: {
      name: item.user_id ? `Creator ${item.user_id.slice(0, 6)}` : "Green Creator",
      avatar: "",
    },
    image: primaryMedia,
    images: mediaItems.length ? mediaItems : primaryMedia ? [primaryMedia] : [],
    likes: 0,
    caption: caption || item.title || "Bài đăng cộng đồng",
    comments: [],
    date: formatPostDate(item.created_at),
  };
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
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
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
  headerTitle: {
    fontWeight: 700,
    fontSize: "20px",
    color: "#1E1E1E",
    textTransform: "capitalize",
    margin: 0,
  },
  iconPlaceholder: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1E1E1E",
    textDecoration: "none",
    cursor: "pointer",
  },
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "clamp(16px, 3.6vw, 20px)",
  },
  searchSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "16px",
    minHeight: "48px",
  },
  searchInputContainer: {
    flex: 1,
    height: "48px",
    background: "#F9FAFB",
    border: "1px solid #AAAAAA",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "0 10px",
    gap: "6px",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    width: "100%",
    fontSize: "16px",
    color: "#111827",
  },
  filterButton: {
    width: "48px",
    height: "48px",
    border: "1px solid #51B788",
    borderRadius: "16px",
    background: "#FFFFFF",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  feedContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingBottom: "8px",
  },
  tabsWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0",
    borderBottom: "1px solid #E5E7EB",
  },
  tabBtn: {
    border: "none",
    background: "transparent",
    padding: "12px 16px",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    color: "#6B7280",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabBtnActive: {
    color: "#11A94D",
    fontWeight: 700,
    borderBottom: "2px solid #11A94D",
  },
  postCard: {
    background: "#FFFFFF",
    border: "1px solid #EDEDED",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    cursor: "pointer",
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
  moreOptions: {
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "none",
    background: "transparent",
  },
  postImagePlaceholder: {
    width: "100%",
    height: "220px",
    borderRadius: "12px",
    background: "#F0F2F5",
    objectFit: "cover",
  },
  postVideo: {
    width: "100%",
    height: "220px",
    borderRadius: "12px",
    background: "#000000",
    objectFit: "contain",
    display: "block",
  },
  postActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  actionGroupRight: {
    display: "flex",
    alignItems: "center",
  },
  likedIcon: {
    stroke: "#11A94D",
    fill: "#11A94D",
  },
  paginationDots: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  dotButton: {
    border: "none",
    padding: 0,
    cursor: "pointer",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: "4px",
    height: "4px",
    borderRadius: "999px",
    background: "#B6B6B6",
  },
  carouselWrap: {
    position: "relative",
    width: "100%",
  },
  carouselViewport: {
    width: "100%",
    height: "220px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#F0F2F5",
  },
  carouselTrack: {
    display: "flex",
    width: "100%",
    height: "100%",
    transition: "transform 0.28s ease",
    willChange: "transform",
  },
  carouselSlide: {
    flex: "0 0 100%",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#F0F2F5",
  },
  carouselArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "34px",
    height: "34px",
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
  carouselArrowLeft: {
    left: "8px",
  },
  carouselArrowRight: {
    right: "8px",
  },
  postDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  likesCount: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  caption: {
    fontSize: "13px",
    color: "#1E1E1E",
    lineHeight: "18px",
  },
  boldText: {
    fontWeight: 700,
  },
  commentRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    fontSize: "13px",
    color: "#1E1E1E",
  },
  textPostBlock: {
    borderRadius: "12px",
    border: "1px solid #DCFCE7",
    background: "#F0FDF4",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  textPostTitle: {
    margin: 0,
    color: "#065F46",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: "20px",
  },
  textPostContent: {
    margin: 0,
    color: "#1F2937",
    fontSize: "14px",
    lineHeight: "22px",
    whiteSpace: "pre-wrap",
  },
  commentText: {
    flex: 1,
    lineHeight: "18px",
  },
  likedComment: {
    color: "#51B788",
    fontWeight: 700,
  },
  dateText: {
    fontSize: "12px",
    color: "#8A8A8A",
  },
  commentComposer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "2px",
  },
  commentComposerInput: {
    flex: 1,
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    padding: "9px 10px",
    fontSize: "13px",
    outline: "none",
  },
  commentComposerButton: {
    border: "none",
    background: "#11A94D",
    color: "#FFFFFF",
    borderRadius: "10px",
    padding: "9px 11px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  interactionErrorText: {
    margin: 0,
    color: "#B91C1C",
    fontSize: "12px",
  },
  menuWrap: {
    position: "relative",
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: "22px",
    minWidth: "146px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
    zIndex: 20,
    overflow: "hidden",
  },
  dropdownItem: {
    width: "100%",
    border: "none",
    background: "#FFFFFF",
    textAlign: "left",
    padding: "10px 12px",
    fontSize: "13px",
    cursor: "pointer",
    color: "#111827",
  },
  dropdownItemDanger: {
    color: "#B91C1C",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,24,39,0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 1200,
    padding: "16px",
  },
  modalCard: {
    width: "100%",
    maxWidth: "560px",
    maxHeight: "82vh",
    overflowY: "auto",
    background: "#FFFFFF",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  modalCommentInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  modalCommentInput: {
    flex: 1,
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    outline: "none",
  },
  modalSendBtn: {
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

const GreenCreator = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "interacted" | "saved" | "own">("all");
  const [allPosts, setAllPosts] = useState<CommunityPostItem[]>([]);
  const [profileByUserId, setProfileByUserId] = useState<Record<string, ProfileResult>>({});
  const [interactionsByPostId, setInteractionsByPostId] = useState<Record<string, CommunityPostInteractionItem[]>>({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<string, string>>({});
  const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [workingPostId, setWorkingPostId] = useState<string | null>(null);
  const [workingInteractionPostId, setWorkingInteractionPostId] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [interactionErrorPostId, setInteractionErrorPostId] = useState<string | null>(null);
  const [activeMediaIndexByPostId, setActiveMediaIndexByPostId] = useState<Record<string, number>>({});
  const userId = useAuthStore((state) => state.user?.user_id ?? "");
  const userName = useAuthStore((state) => state.user?.name ?? "Bạn");

  const resolveActorUserId = () => {
    if (userId) {
      return userId;
    }

    return window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
  };

  useEffect(() => {
    const fallbackUserId = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    const activeUserId = userId || fallbackUserId;

    const controller = new AbortController();

    const loadPosts = async () => {
      try {
        const response = await fetch(`/api/community/posts?scope=all&userId=${encodeURIComponent(activeUserId)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as CommunityPostItem[] | { error: string };

        if (!response.ok || !Array.isArray(data)) {
          setAllPosts([]);
          return;
        }

        setAllPosts(data);
      } catch {
        setAllPosts([]);
      }
    };

    void loadPosts();

    return () => {
      controller.abort();
    };
  }, [userId]);

  useEffect(() => {
    const postIds = Array.from(new Set(allPosts.map((post) => post.post_id).filter(Boolean)));

    if (!postIds.length) {
      setInteractionsByPostId({});
      return;
    }

    const controller = new AbortController();

    const loadInteractions = async () => {
      try {
        const results = await Promise.all(
          postIds.map(async (postId) => {
            const response = await fetch(`/api/community/posts/interactions?postId=${encodeURIComponent(postId)}`, {
              signal: controller.signal,
            });
            const data = (await response.json()) as { items?: CommunityPostInteractionItem[]; error?: string };

            if (!response.ok) {
              return [postId, [] as CommunityPostInteractionItem[]] as const;
            }

            return [postId, Array.isArray(data.items) ? data.items : ([] as CommunityPostInteractionItem[])] as const;
          })
        );

        if (controller.signal.aborted) {
          return;
        }

        const nextMap: Record<string, CommunityPostInteractionItem[]> = {};
        results.forEach(([postId, items]) => {
          nextMap[postId] = items;
        });
        setInteractionsByPostId(nextMap);
      } catch {
        if (!controller.signal.aborted) {
          setInteractionsByPostId({});
        }
      }
    };

    void loadInteractions();

    return () => {
      controller.abort();
    };
  }, [allPosts]);

  useEffect(() => {
    const interactionUsers = Object.values(interactionsByPostId)
      .flat()
      .map((item) => item.user_id)
      .filter(Boolean);

    const uniqueUserIds = Array.from(new Set([...allPosts.map((post) => post.user_id).filter(Boolean), ...interactionUsers]));

    if (!uniqueUserIds.length) {
      setProfileByUserId({});
      return;
    }

    const controller = new AbortController();

    const loadProfiles = async () => {
      try {
        const profiles = await Promise.all(
          uniqueUserIds.map(async (postUserId) => {
            const response = await fetch(`/api/account/profile?userId=${encodeURIComponent(postUserId)}`, {
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
  }, [allPosts, interactionsByPostId]);

  const refreshInteractionsForPost = async (postId: string) => {
    const response = await fetch(`/api/community/posts/interactions?postId=${encodeURIComponent(postId)}`);
    const data = (await response.json()) as { items?: CommunityPostInteractionItem[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Không thể tải tương tác.");
    }

    setInteractionsByPostId((current) => ({
      ...current,
      [postId]: Array.isArray(data.items) ? data.items : [],
    }));
  };

  const handleToggleLike = async (postId: string) => {
    const actorUserId = resolveActorUserId();
    if (!actorUserId || workingInteractionPostId === postId) {
      return;
    }

    const postInteractions = interactionsByPostId[postId] ?? [];
    const liked = postInteractions.some((item) => item.type === "like" && item.user_id === actorUserId);

    setWorkingInteractionPostId(postId);
    setInteractionError(null);
    setInteractionErrorPostId(null);

    try {
      if (liked) {
        const response = await fetch("/api/community/posts/interactions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId,
            userId: actorUserId,
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
            postId,
            userId: actorUserId,
            type: "like",
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Không thể thích bài đăng.");
        }
      }

      await refreshInteractionsForPost(postId);
    } catch (error) {
      setInteractionErrorPostId(postId);
      setInteractionError(error instanceof Error ? error.message : "Không thể thao tác tương tác.");
    } finally {
      setWorkingInteractionPostId(null);
    }
  };

  const handleAddComment = async (postId: string) => {
    const actorUserId = resolveActorUserId();
    const draft = (commentDraftByPostId[postId] ?? "").trim();
    if (!actorUserId || !draft || workingInteractionPostId === postId) {
      return;
    }

    setWorkingInteractionPostId(postId);
    setInteractionError(null);
    setInteractionErrorPostId(null);

    try {
      const response = await fetch("/api/community/posts/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          userId: actorUserId,
          type: "comment",
          comment: draft,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Không thể gửi bình luận.");
      }

      setCommentDraftByPostId((current) => ({
        ...current,
        [postId]: "",
      }));
      await refreshInteractionsForPost(postId);
    } catch (error) {
      setInteractionErrorPostId(postId);
      setInteractionError(error instanceof Error ? error.message : "Không thể gửi bình luận.");
    } finally {
      setWorkingInteractionPostId(null);
    }
  };

  const handleToggleBookmark = async (postId: string) => {
    const actorUserId = resolveActorUserId();
    if (!actorUserId || workingInteractionPostId === postId) {
      return;
    }

    const postInteractions = interactionsByPostId[postId] ?? [];
    const bookmarked = postInteractions.some((item) => item.type === "bookmark" && item.user_id === actorUserId);

    setWorkingInteractionPostId(postId);
    setInteractionError(null);
    setInteractionErrorPostId(null);

    try {
      if (bookmarked) {
        const response = await fetch("/api/community/posts/interactions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId,
            userId: actorUserId,
            type: "bookmark",
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Không thể bỏ lưu bài đăng.");
        }
      } else {
        const response = await fetch("/api/community/posts/interactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId,
            userId: actorUserId,
            type: "bookmark",
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Không thể lưu bài đăng.");
        }
      }

      await refreshInteractionsForPost(postId);
    } catch (error) {
      setInteractionErrorPostId(postId);
      setInteractionError(error instanceof Error ? error.message : "Không thể lưu bài đăng.");
    } finally {
      setWorkingInteractionPostId(null);
    }
  };

  const filteredPosts = useMemo<Post[]>(() => {
    if (!allPosts.length) {
      return [];
    }

    let results = allPosts;
    const actorUserId = resolveActorUserId();

    // Filter by tab
    if (activeTab === "own") {
      results = results.filter((post) => post.user_id === userId);
    } else if (activeTab === "interacted") {
      results = results.filter((post) => {
        const interactions = interactionsByPostId[post.post_id] ?? [];
        return interactions.some((item) => {
          if (item.user_id !== actorUserId) {
            return false;
          }

          if (item.type === "like") {
            return true;
          }

          return item.type === "comment" && item.status !== "deleted";
        });
      });
    } else if (activeTab === "saved") {
      results = results.filter((post) => {
        const interactions = interactionsByPostId[post.post_id] ?? [];
        return interactions.some((item) => item.user_id === actorUserId && item.type === "bookmark");
      });
    }

    // Filter by search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      results = results.filter((post) => {
        const title = (post.title ?? "").toLowerCase();
        const content = (post.content ?? "").toLowerCase();
        return title.includes(query) || content.includes(query);
      });
    }

    return results.map(mapCommunityPostToUi);
  }, [allPosts, activeTab, interactionsByPostId, searchQuery, userId]);

  const renderPostMedia = (post: Post) => {
    const mediaItems = post.images.length ? post.images : post.image ? [post.image] : [];

    if (!mediaItems.length) {
      return <div style={styles.postImagePlaceholder} />;
    }

    const activeIndex = Math.min(activeMediaIndexByPostId[post.postId] ?? 0, mediaItems.length - 1);
    const normalizedMediaUrl = mediaItems[activeIndex].toLowerCase();
    const isVideo = post.mediaType === "MP4" || normalizedMediaUrl.endsWith(".mp4") || normalizedMediaUrl.includes(".mp4?");

    const goToPreviousMedia = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (mediaItems.length <= 1) {
        return;
      }

      setActiveMediaIndexByPostId((current) => ({
        ...current,
        [post.postId]: activeIndex === 0 ? mediaItems.length - 1 : activeIndex - 1,
      }));
    };

    const goToNextMedia = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (mediaItems.length <= 1) {
        return;
      }

      setActiveMediaIndexByPostId((current) => ({
        ...current,
        [post.postId]: activeIndex + 1 >= mediaItems.length ? 0 : activeIndex + 1,
      }));
    };

    return (
      <div style={styles.carouselWrap} onClick={(event) => event.stopPropagation()}>
        <div style={styles.carouselViewport}>
          <div
            style={{
              ...styles.carouselTrack,
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
          >
            {mediaItems.map((mediaUrl, index) => {
              const normalizedItem = mediaUrl.toLowerCase();
              const itemIsVideo = post.mediaType === "MP4" || normalizedItem.endsWith(".mp4") || normalizedItem.includes(".mp4?");

              return (
                <div key={`${post.postId}-${index}-${mediaUrl}`} style={styles.carouselSlide}>
                  {itemIsVideo ? (
                    <video src={mediaUrl} controls playsInline preload="metadata" style={styles.postVideo} />
                  ) : (
                    <img src={mediaUrl} alt={`${post.title} ${index + 1}`} style={styles.postImagePlaceholder} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {mediaItems.length > 1 ? (
          <>
            <button type="button" style={{ ...styles.carouselArrow, ...styles.carouselArrowLeft }} onClick={goToPreviousMedia} aria-label="Xem media trước">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" style={{ ...styles.carouselArrow, ...styles.carouselArrowRight }} onClick={goToNextMedia} aria-label="Xem media tiếp theo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}

        {mediaItems.length > 1 ? (
          <div style={styles.paginationDots}>
            {mediaItems.map((_, index) => (
              <button
                key={`${post.postId}-dot-${index}`}
                type="button"
                style={styles.dotButton}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveMediaIndexByPostId((current) => ({
                    ...current,
                    [post.postId]: index,
                  }));
                }}
                aria-label={`Xem media ${index + 1}`}
              >
                <span style={{ ...styles.dot, background: index === activeIndex ? "#41916C" : "#B6B6B6", width: index === activeIndex ? "6px" : "4px", height: index === activeIndex ? "6px" : "4px" }} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const resolveAuthorName = (post: Post) => {
    const profileName = profileByUserId[post.userId]?.name;
    if (profileName) {
      return profileName;
    }

    if (post.userId === userId) {
      return userName;
    }

    return post.author.name;
  };

  const resolveAuthorAvatar = (post: Post) => {
    const profileAvatar = profileByUserId[post.userId]?.image_url;
    if (profileAvatar) {
      return profileAvatar;
    }

    return post.author.avatar;
  };

  const getInteractionProfileName = (value: string) => {
    const profileName = profileByUserId[value]?.name;
    if (profileName) {
      return profileName;
    }

    return value === userId ? userName : `Creator ${value.slice(0, 6)}`;
  };

  const handleSharePost = async (post: Post) => {
    const shareUrl = `${window.location.origin}/green-creators?post=${encodeURIComponent(post.postId)}`;
    const shareText = `${post.author.name}: ${post.caption}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || "Green Creator",
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        window.alert("Đã sao chép link bài đăng.");
      }
    } catch {
      // User canceled share flow.
    } finally {
      setActiveMenuPostId(null);
    }
  };

  const handleEditPost = async (post: Post) => {
    const nextContent = window.prompt("Chỉnh sửa nội dung bài đăng", post.content || post.caption);
    if (nextContent === null) {
      return;
    }

    const trimmed = nextContent.trim();
    if (!trimmed || !userId) {
      return;
    }

    setWorkingPostId(post.postId);

    try {
      const response = await fetch("/api/community/posts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          postId: post.postId,
          title: post.title,
          content: trimmed,
          type: post.type,
          mediaType: post.mediaType,
          mediaUrl: post.image || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật bài đăng.");
      }

      setAllPosts((current) => current.map((item) => (item.post_id === post.postId ? { ...item, content: trimmed } : item)));
      setActiveMenuPostId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể cập nhật bài đăng.");
    } finally {
      setWorkingPostId(null);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!userId) {
      return;
    }

    const accepted = window.confirm("Bạn có chắc muốn xóa bài đăng này?");
    if (!accepted) {
      return;
    }

    setWorkingPostId(post.postId);

    try {
      const response = await fetch("/api/community/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          postId: post.postId,
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể xóa bài đăng.");
      }

      setAllPosts((current) => current.filter((item) => item.post_id !== post.postId));
      setActiveMenuPostId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể xóa bài đăng.");
    } finally {
      setWorkingPostId(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
        <div style={styles.iconPlaceholder}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.headerTitle}>Nhà Sáng Tạo</h1>
        <Link href="/green-upload" style={styles.iconPlaceholder} aria-label="Tạo bài đăng mới">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 12H19" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
        </header>

        <main style={styles.mainContent}>
        <div style={styles.searchSection}>
          <div style={styles.searchInputContainer}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                stroke="#AAAAAA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M21 21L16.65 16.65" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm trên Green Creator"
              style={styles.searchInput}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <button type="button" style={styles.filterButton} aria-label="Tìm kiếm bài đăng">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="#51B788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div style={styles.tabsWrap}>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              ...(activeTab === "all" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("all")}
          >
            Tất cả
          </button>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              ...(activeTab === "interacted" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("interacted")}
          >
            Đã tương tác
          </button>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              ...(activeTab === "saved" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("saved")}
          >
            Đã lưu
          </button>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              ...(activeTab === "own" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("own")}
          >
            Blog của tôi
          </button>
        </div>

        <div style={styles.feedContainer}>
          {filteredPosts.map((post: Post) => {
            const postInteractions = interactionsByPostId[post.postId] ?? [];
            const likeCount = postInteractions.filter((item) => item.type === "like").length;
            const bookmarkCount = postInteractions.filter((item) => item.type === "bookmark").length;
            const likedByCurrentUser = Boolean(resolveActorUserId() && postInteractions.some((item) => item.type === "like" && item.user_id === resolveActorUserId()));
            const bookmarkedByCurrentUser = Boolean(
              resolveActorUserId() && postInteractions.some((item) => item.type === "bookmark" && item.user_id === resolveActorUserId())
            );
            const visibleComments: Comment[] = postInteractions
              .filter((item) => item.type === "comment" && item.status !== "deleted")
              .sort((left, right) => left.created_at.localeCompare(right.created_at))
              .slice(-2)
              .map((item) => ({
                id: item.interaction_id,
                userId: item.user_id,
                username: getInteractionProfileName(item.user_id),
                text: item.comment ?? "",
                createdAt: item.created_at,
              }));

            const commentCount = postInteractions.filter((item) => item.type === "comment" && item.status !== "deleted").length;
            const commentDraft = commentDraftByPostId[post.postId] ?? "";
            const commentExpanded = expandedCommentPostId === post.postId;

            return (
            <article
              key={post.id}
              style={styles.postCard}
              onClick={() => router.push(`/green-creators/${post.postId}`)}
            >
              <div style={styles.postHeader}>
                <div style={styles.authorInfo}>
                  <div style={styles.avatarPlaceholder}>
                    {resolveAuthorAvatar(post) ? (
                      <img
                        src={resolveAuthorAvatar(post)}
                        alt={resolveAuthorName(post)}
                        style={{ width: "100%", height: "100%", borderRadius: "999px", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280" }}>{getInitials(resolveAuthorName(post))}</span>
                    )}
                  </div>
                  <span style={styles.authorName}>{resolveAuthorName(post)}</span>
                </div>
                <div style={styles.menuWrap}>
                  <button
                    type="button"
                    style={styles.moreOptions}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveMenuPostId((current) => (current === post.postId ? null : post.postId));
                    }}
                    aria-label="Tùy chọn bài đăng"
                  >
                    <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
                      <circle cx="2" cy="2" r="2" fill="#000000" />
                      <circle cx="2" cy="8" r="2" fill="#000000" />
                      <circle cx="2" cy="14" r="2" fill="#000000" />
                    </svg>
                  </button>

                  {activeMenuPostId === post.postId ? (
                    <div style={styles.dropdownMenu} onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        style={styles.dropdownItem}
                        onClick={() => void handleSharePost(post)}
                      >
                        Chia sẻ
                      </button>
                      {post.userId === userId ? (
                        <>
                          <button
                            type="button"
                            style={styles.dropdownItem}
                            onClick={() => void handleEditPost(post)}
                            disabled={workingPostId === post.postId}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }}
                            onClick={() => void handleDeletePost(post)}
                            disabled={workingPostId === post.postId}
                          >
                            Xóa bài đăng
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {post.type !== "community" ? renderPostMedia(post) : null}

              <div style={styles.postActions}>
                <div style={styles.actionGroupLeft}>
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleLike(post.postId);
                    }}
                    aria-label="Thích bài đăng"
                    disabled={workingInteractionPostId === post.postId}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={likedByCurrentUser ? "#E11D48" : "none"}
                      stroke="#000000"
                      strokeWidth="2"
                      style={likedByCurrentUser ? styles.likedIcon : undefined}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedCommentPostId((current) => (current === post.postId ? null : post.postId));
                    }}
                    aria-label="Bình luận bài đăng"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleSharePost(post);
                    }}
                    aria-label="Chia sẻ bài đăng"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>

                <div
                  style={styles.actionGroupRight}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleBookmark(post.postId);
                    }}
                    aria-label="Lưu bài đăng"
                    disabled={workingInteractionPostId === post.postId}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={bookmarkedByCurrentUser ? "#11A94D" : "none"} stroke="#000000" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div style={styles.postDetails}>
                <div style={styles.likesCount}>{likeCount} Lượt Thích · {commentCount} Bình luận · {bookmarkCount} Đã lưu</div>
                {post.type === "community" ? (
                  <div style={styles.textPostBlock}>
                    <p style={styles.textPostTitle}>{post.title || "Bài viết cộng đồng"}</p>
                    <p style={styles.textPostContent}>{post.content || "Không có nội dung"}</p>
                  </div>
                ) : null}
                <div style={styles.caption}>
                  <span style={styles.boldText}>{resolveAuthorName(post)}</span> {post.caption}
                </div>
                {visibleComments.map((comment: Comment) => (
                  <div key={comment.id} style={styles.commentRow}>
                    <span style={styles.commentText}>
                      <span style={styles.boldText}>{comment.username}</span> {comment.text}
                    </span>
                  </div>
                ))}

                {commentExpanded ? (
                  <div
                    style={styles.commentComposer}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Viết bình luận..."
                      style={styles.commentComposerInput}
                      value={commentDraft}
                      onChange={(event) =>
                        setCommentDraftByPostId((current) => ({
                          ...current,
                          [post.postId]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleAddComment(post.postId);
                        }
                      }}
                    />
                    <button
                      type="button"
                      style={styles.commentComposerButton}
                      onClick={() => void handleAddComment(post.postId)}
                      disabled={workingInteractionPostId === post.postId}
                    >
                      Gửi
                    </button>
                  </div>
                ) : null}

                {interactionError && interactionErrorPostId === post.postId ? <p style={styles.interactionErrorText}>{interactionError}</p> : null}
                <div style={styles.dateText}>{post.date}</div>
              </div>
            </article>
            );
          })}
        </div>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
};

export default GreenCreator;
