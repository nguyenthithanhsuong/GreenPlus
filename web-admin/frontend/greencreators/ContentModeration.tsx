"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import ContentDetailDrawer from "./ContentDetailDrawer";
import ContentStats from "./ContentStats";
import ContentTable from "./ContentTable";
import { GreenCreatorPostRow, GreenCreatorPostStatus } from "../../backend/modules/community/greencreator-content.types";

type ContentStatusFilter = "all" | GreenCreatorPostStatus;

const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const ContentModeration = () => {
  const [posts, setPosts] = useState<GreenCreatorPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<ContentStatusFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/greencreators", { cache: "no-store" });
      const data = (await response.json()) as { items?: GreenCreatorPostRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách bài Green Creator");
      }

      setPosts(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách bài Green Creator");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const stats = useMemo(() => {
    const pendingPosts = posts.filter((post) => post.status === "pending").length;
    const approvedPosts = posts.filter((post) => post.status === "approved").length;
    const rejectedPosts = posts.filter((post) => post.status === "rejected").length;

    return {
      totalPosts: posts.length,
      pendingPosts,
      approvedPosts,
      rejectedPosts,
      totalComments: posts.reduce((sum, post) => sum + post.comment_count, 0),
      totalInteractions: posts.reduce((sum, post) => sum + post.interaction_count, 0),
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = normalizeText(searchValue);

    return posts.filter((post) => {
      const statusMatch = activeStatus === "all" || post.status === activeStatus;
      if (!statusMatch) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchable = [
        post.title,
        post.content,
        post.author_name,
        post.type,
        ...post.interactions.flatMap((interaction) => [interaction.comment, interaction.user_name, interaction.type]),
      ]
        .map((value) => normalizeText(value))
        .join(" ");

      return searchable.includes(keyword);
    });
  }, [activeStatus, posts, searchValue]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.post_id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  const updateStatus = useCallback(
    async (post: GreenCreatorPostRow, status: GreenCreatorPostStatus) => {
      setSavingPostId(post.post_id);
      setError(null);

      try {
        const response = await fetch(`/api/greencreators/${encodeURIComponent(post.post_id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể cập nhật trạng thái bài đăng");
        }

        await loadPosts();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật trạng thái bài đăng");
      } finally {
        setSavingPostId(null);
      }
    },
    [loadPosts]
  );

  const pageActions = (
    <button
      type="button"
      onClick={() => void loadPosts()}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
      disabled={loading || Boolean(savingPostId)}
    >
      <RefreshCw className="h-4 w-4" />
      Tải lại
    </button>
  );

  return (
    <AdminShell
      title="Kiểm duyệt Green Creator"
      description="Duyệt, từ chối và xem toàn bộ bài đăng, media, bình luận và tương tác của Green Creator."
      searchPlaceholder="Tìm kiếm bài đăng, tác giả..."
      pageActions={pageActions}
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <ContentStats {...stats} />

      <ContentTable
        posts={filteredPosts}
        loading={loading}
        savingPostId={savingPostId}
        activeStatus={activeStatus}
        searchValue={searchValue}
        onStatusChange={setActiveStatus}
        onSearchChange={setSearchValue}
        onViewPost={(post) => setSelectedPostId(post.post_id)}
        onApprovePost={(post) => void updateStatus(post, "approved")}
        onRejectPost={(post) => void updateStatus(post, "rejected")}
      />

      <ContentDetailDrawer
        post={selectedPost}
        saving={Boolean(savingPostId)}
        onClose={() => setSelectedPostId(null)}
        onApprove={(post) => void updateStatus(post, "approved")}
        onReject={(post) => void updateStatus(post, "rejected")}
      />
    </AdminShell>
  );
};

export default ContentModeration;
