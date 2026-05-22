"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import CreatePostModal from "./CreatePostModal";
import ContentDetailDrawer from "./ContentDetailDrawer";
import ContentStats from "./ContentStats";
import ContentTable from "./ContentTable";
import { usePermissions } from "@/lib/usePermissions";
import { useAuthStore } from "@/lib/stores/authStore";
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
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const accessToken = useAuthStore((state) => state.session?.access_token ?? "");
  const { hasPermission } = usePermissions();
  const canCreatePost = hasPermission("content.create");
  const canDeletePost = hasPermission("content.delete");
  const canModeratePost = hasPermission("content.update");

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
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
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
    [accessToken, loadPosts]
  );

  const uploadAttachment = useCallback(async (postId: string, files: File[]) => {
    if (!files.length) {
      return;
    }

    const formData = new FormData();
    formData.append("postId", postId);
    files.forEach((selectedFile) => formData.append("files", selectedFile));

    const response = await fetch("/api/greencreators/attachment", {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      body: formData,
    });

    const data = (await response.json()) as { mediaUrls?: string[]; error?: string };
    if (!response.ok || !Array.isArray(data.mediaUrls)) {
      throw new Error(data.error ?? "Upload file thất bại");
    }
  }, [accessToken]);

  const handleCreatePost = useCallback(async (input: { title: string; content: string; type: "blog" | "video" | "community"; files: File[] }) => {
    setSavingPostId("creating");
    setError(null);

    try {
      const createResponse = await fetch("/api/greencreators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          type: input.type,
        }),
      });

      const createData = (await createResponse.json()) as GreenCreatorPostRow | { error?: string };
      if (!createResponse.ok || !("post_id" in createData)) {
        const errorMessage = "error" in createData ? createData.error : undefined;
        throw new Error(errorMessage ?? "Tạo bài đăng thất bại");
      }

      if (input.files.length) {
        await uploadAttachment(createData.post_id, input.files);
      }

      setOpenCreateModal(false);
      await loadPosts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tạo bài đăng");
      throw requestError;
    } finally {
      setSavingPostId(null);
    }
  }, [accessToken, loadPosts, uploadAttachment]);

  const deletePost = useCallback(async (post: GreenCreatorPostRow) => {
    if (!confirm(`Bạn có chắc muốn xóa bài "${post.title}"?`)) {
      return;
    }

    setSavingPostId(post.post_id);
    setError(null);

    try {
      const response = await fetch(`/api/greencreators/${encodeURIComponent(post.post_id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ force: true }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Không thể xóa bài đăng");
      }

      await loadPosts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể xóa bài đăng");
    } finally {
      setSavingPostId(null);
    }
  }, [accessToken, loadPosts]);

  const pageActions = (
    <div className="flex items-center gap-2">
      {canCreatePost ? (
        <button
          type="button"
          onClick={() => setOpenCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          disabled={loading || Boolean(savingPostId)}
        >
          <Plus className="h-4 w-4" />
          Tạo bài mới
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => void loadPosts()}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        disabled={loading || Boolean(savingPostId)}
      >
        <RefreshCw className="h-4 w-4" />
        Tải lại
      </button>
    </div>
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
        onDeletePost={(post) => void deletePost(post)}
        canModerate={canModeratePost}
        canDelete={canDeletePost}
      />

      <ContentDetailDrawer
        post={selectedPost}
        saving={Boolean(savingPostId)}
        onClose={() => setSelectedPostId(null)}
        onApprove={(post) => void updateStatus(post, "approved")}
        onReject={(post) => void updateStatus(post, "rejected")}
      />

      <CreatePostModal
        open={openCreateModal}
        loading={Boolean(savingPostId)}
        onClose={() => setOpenCreateModal(false)}
        onSubmit={handleCreatePost}
      />
    </AdminShell>
  );
};

export default ContentModeration;
