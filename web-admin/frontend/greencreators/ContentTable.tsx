"use client";

import { AlignLeft, Check, Eye, Image as ImageIcon, MessageSquareText, PlaySquare, Search, Trash2, X } from "lucide-react";
import { GreenCreatorPostRow, GreenCreatorPostStatus } from "../../backend/modules/greencreators/greencreator-content.types";

type ContentStatusFilter = "all" | GreenCreatorPostStatus;

type ContentTableProps = {
  posts: GreenCreatorPostRow[];
  loading: boolean;
  savingPostId: string | null;
  activeStatus: ContentStatusFilter;
  searchValue: string;
  onStatusChange: (value: ContentStatusFilter) => void;
  onSearchChange: (value: string) => void;
  onViewPost: (post: GreenCreatorPostRow) => void;
  onApprovePost: (post: GreenCreatorPostRow) => void;
  onRejectPost: (post: GreenCreatorPostRow) => void;
  onDeletePost: (post: GreenCreatorPostRow) => void;
  canModerate: boolean;
  canDelete: boolean;
};

const statusTabs: Array<{ value: ContentStatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
];

const formatStatusLabel = (status: GreenCreatorPostStatus) => {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
};

const renderTypeBadge = (type: string) => {
  if (type === "community") {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700">
        <ImageIcon className="h-3.5 w-3.5" />
        Community
      </span>
    );
  }

  if (type === "video") {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700">
        <PlaySquare className="h-3.5 w-3.5" />
        Video
      </span>
    );
  }

  return (
    <span className="flex w-fit items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
      <AlignLeft className="h-3.5 w-3.5" />
      Blog
    </span>
  );
};

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".m3u8"];

const isVideoUrl = (url: string | null | undefined) => {
  if (!url) {
    return false;
  }

  const rawPath = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  })();

  const normalizedPath = rawPath.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => normalizedPath.endsWith(extension));
};

const ContentTable = ({
  posts,
  loading,
  savingPostId,
  activeStatus,
  searchValue,
  onStatusChange,
  onSearchChange,
  onViewPost,
  onApprovePost,
  onRejectPost,
  onDeletePost,
  canModerate,
  canDelete,
}: ContentTableProps) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-50 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-1">
          {statusTabs.map((tab) => {
            const active = activeStatus === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 lg:w-[360px]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tiêu đề, tác giả, bình luận..."
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500">
            <tr>
              <th className="w-[32%] px-6 py-4 font-medium">Nội dung</th>
              <th className="px-6 py-4 font-medium">Loại</th>
              <th className="px-6 py-4 font-medium">Tác giả</th>
              <th className="px-6 py-4 font-medium">Tương tác</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 text-right font-medium">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-12 text-center text-sm text-gray-500" colSpan={6}>
                  Đang tải dữ liệu Green Creator...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center text-sm text-gray-500" colSpan={6}>
                  Không có bài đăng phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const status = post.status ?? "pending";
                const saving = savingPostId === post.post_id;
                const statusLabel = formatStatusLabel(status);
                const firstMediaUrl = post.media[0]?.media_url ?? null;
                const shouldRenderVideoThumb = post.type === "video" || isVideoUrl(firstMediaUrl);

                return (
                  <tr key={post.post_id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/60">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-4">
                        {firstMediaUrl ? (
                          shouldRenderVideoThumb ? (
                            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-100">
                              <video
                                src={firstMediaUrl}
                                muted
                                playsInline
                                preload="metadata"
                                className="h-full w-full object-cover"
                              />
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                                <PlaySquare className="h-4 w-4 text-white" />
                              </span>
                            </div>
                          ) : (
                            <img
                              src={firstMediaUrl}
                              alt={post.title}
                              className="h-12 w-16 shrink-0 rounded-lg border border-gray-100 object-cover"
                            />
                          )
                        ) : (
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-400">
                            <AlignLeft className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="mb-0.5 truncate font-bold text-gray-900">{post.title}</p>
                          <p className="line-clamp-2 text-xs text-gray-500">{post.content}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">{renderTypeBadge(post.type)}</td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.author_image_url ?? "https://i.pravatar.cc/150?img=32"}
                          alt={post.author_name ?? "Author"}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{post.author_name ?? "N/A"}</p>
                          <p className="text-xs text-gray-400">
                            {post.created_at ? new Date(post.created_at).toLocaleString("vi-VN") : "Chưa có thời gian"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1.5 font-medium text-gray-700">
                          <MessageSquareText className="h-3.5 w-3.5 text-gray-400" />
                          {post.comment_count.toLocaleString("vi-VN")} bình luận
                        </p>
                        <p>{post.interaction_count.toLocaleString("vi-VN")} tương tác</p>
                        <p>{post.media_count.toLocaleString("vi-VN")} media</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            status === "approved" ? "bg-emerald-500" : status === "rejected" ? "bg-red-500" : "bg-yellow-500"
                          }`}
                        />
                        <span
                          className={`text-[13px] font-semibold ${
                            status === "approved"
                              ? "text-emerald-600"
                              : status === "rejected"
                                ? "text-red-500"
                                : "text-yellow-600"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-right">
                      <div className="mt-0.5 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewPost(post)}
                          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onApprovePost(post)}
                          disabled={!canModerate || saving || status === "approved"}
                          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Duyệt"
                        >
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onRejectPost(post)}
                          disabled={!canModerate || saving || status === "rejected"}
                          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Từ chối"
                        >
                          <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => onDeletePost(post)}
                            disabled={saving}
                            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Xóa bài"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Hiển thị <span className="font-bold text-gray-900">{posts.length.toLocaleString("vi-VN")}</span> bài đăng
        </span>
        <span>
          Lọc theo trạng thái <span className="font-bold text-gray-900">{activeStatus === "all" ? "Tất cả" : formatStatusLabel(activeStatus)}</span>
        </span>
      </div>
    </div>
  );
};

export default ContentTable;