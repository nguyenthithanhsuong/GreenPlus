"use client";

import { CalendarDays, Check, Image as ImageIcon, MessageSquareText, PlaySquare, X } from "lucide-react";
import { GreenCreatorPostRow } from "../../backend/modules/community/greencreator-content.types";

type ContentDetailDrawerProps = {
  post: GreenCreatorPostRow | null;
  saving: boolean;
  onClose: () => void;
  onApprove: (post: GreenCreatorPostRow) => void;
  onReject: (post: GreenCreatorPostRow) => void;
};

const formatStatus = (status: GreenCreatorPostRow["status"]) => {
  if (status === "approved") return { label: "Approved", className: "text-emerald-600 bg-emerald-50" };
  if (status === "rejected") return { label: "Rejected", className: "text-red-600 bg-red-50" };
  return { label: "Pending", className: "text-yellow-700 bg-yellow-50" };
};

const formatTypeLabel = (type: GreenCreatorPostRow["type"]) => {
  if (type === "video") return { label: "Video", icon: PlaySquare };
  if (type === "community") return { label: "Community", icon: ImageIcon };
  return { label: "Blog", icon: MessageSquareText };
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

const ContentDetailDrawer = ({ post, saving, onClose, onApprove, onReject }: ContentDetailDrawerProps) => {
  if (!post) {
    return null;
  }

  const status = formatStatus(post.status);
  const type = formatTypeLabel(post.type);
  const TypeIcon = type.icon;
  const mediaItems = post.media.filter((item) => Boolean(item.media_url));
  const comments = post.interactions.filter((interaction) => Boolean(interaction.comment?.trim()));

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Đóng chi tiết bài viết"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[780px] flex-col border-l border-gray-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                <TypeIcon className="h-3.5 w-3.5" />
                {type.label}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {post.comment_count} bình luận
              </span>
            </div>

            <h2 className="truncate text-xl font-bold text-gray-900">{post.title}</h2>
            <p className="mt-1 text-sm text-gray-500">Xem nội dung, media, bình luận và toàn bộ tương tác của bài đăng này.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tác giả</p>
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={post.author_image_url ?? "https://i.pravatar.cc/150?img=32"}
                  alt={post.author_name ?? "Author"}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{post.author_name ?? "N/A"}</p>
                  <p className="text-sm text-gray-500">{post.user_id ?? "Không rõ user_id"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Thời gian đăng</p>
              <div className="mt-3 flex items-center gap-3 text-gray-800">
                <CalendarDays className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold">{post.created_at ? new Date(post.created_at).toLocaleDateString("vi-VN") : "Chưa có"}</p>
                  <p className="text-sm text-gray-500">{post.created_at ? new Date(post.created_at).toLocaleTimeString("vi-VN") : ""}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tổng quan</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>{post.media_count} media</p>
                <p>{post.interaction_count} tương tác</p>
                <p>{post.comment_count} bình luận</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Nội dung bài đăng</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{post.content}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">Media đính kèm</p>
                  <span className="text-xs font-medium text-gray-500">{mediaItems.length} file</span>
                </div>

                {mediaItems.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {mediaItems.map((media) => (
                      <a
                        key={media.media_id}
                        href={media.media_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                      >
                        {isVideoUrl(media.media_url) || post.type === "video" ? (
                          <div className="relative">
                            <video
                              src={media.media_url ?? undefined}
                              controls
                              preload="metadata"
                              playsInline
                              className="h-44 w-full object-cover"
                            />
                            <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                              VIDEO
                            </span>
                          </div>
                        ) : (
                          <img
                            src={media.media_url ?? undefined}
                            alt={post.title}
                            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">Bài đăng này chưa có media.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">Bình luận</p>
                  <span className="text-xs font-medium text-gray-500">{comments.length} comment</span>
                </div>

                <div className="mt-4 space-y-3">
                  {comments.length > 0 ? (
                    comments.map((interaction) => (
                      <article key={interaction.interaction_id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={interaction.user_image_url ?? "https://i.pravatar.cc/150?img=32"}
                            alt={interaction.user_name ?? "User"}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900">{interaction.user_name ?? "Người dùng ẩn danh"}</p>
                              <span className="text-xs text-gray-400">
                                {interaction.created_at ? new Date(interaction.created_at).toLocaleString("vi-VN") : ""}
                              </span>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-gray-600">{interaction.comment}</p>
                            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">{interaction.type}</p>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Chưa có bình luận nào cho bài đăng này.</p>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Tương tác</p>

                <div className="mt-4 space-y-3">
                  {post.interactions.length > 0 ? (
                    post.interactions.map((interaction) => (
                      <div key={interaction.interaction_id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={interaction.user_image_url ?? "https://i.pravatar.cc/150?img=32"}
                            alt={interaction.user_name ?? "User"}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-gray-900">{interaction.user_name ?? "Người dùng ẩn danh"}</p>
                              <span className="text-xs text-gray-400">{interaction.type}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {interaction.status ?? "no-status"}
                              {interaction.created_at ? ` • ${new Date(interaction.created_at).toLocaleString("vi-VN")}` : ""}
                            </p>
                            {interaction.comment ? <p className="mt-2 text-sm text-gray-600">{interaction.comment}</p> : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Bài đăng này chưa có tương tác nào.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Hành động</p>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    disabled={saving || post.status === "approved"}
                    onClick={() => onApprove(post)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Duyệt bài
                  </button>

                  <button
                    type="button"
                    disabled={saving || post.status === "rejected"}
                    onClick={() => onReject(post)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Từ chối bài
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ContentDetailDrawer;