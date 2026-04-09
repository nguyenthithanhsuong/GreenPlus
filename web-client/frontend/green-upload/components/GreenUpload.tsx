"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import NavigationBar from "../../dashboard/components/NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

type PostType = "blog" | "video" | "community";

type PostSummary = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  type: PostType;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type CreatedPostResult = {
  post_id: string;
  user_id: string;
  type: PostType;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    fontFamily: "'Inter', sans-serif",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#1E1E1E",
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
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    borderRadius: "16px",
    border: "1px solid #E8EDF2",
    background: "#FFFFFF",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  helperText: {
    margin: 0,
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: "18px",
  },
  label: {
    color: "#1E1E1E",
    fontSize: "13px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "12px",
    border: "1px solid #CFD8E3",
    padding: "10px 12px",
    outline: "none",
    fontSize: "14px",
    color: "#1E1E1E",
    background: "#FDFEFE",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "12px",
    border: "1px solid #CFD8E3",
    padding: "10px 12px",
    outline: "none",
    fontSize: "14px",
    color: "#1E1E1E",
    minHeight: "124px",
    resize: "vertical",
    background: "#FDFEFE",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "12px",
    border: "1px solid #CFD8E3",
    padding: "10px 12px",
    outline: "none",
    fontSize: "14px",
    color: "#1E1E1E",
    background: "#FDFEFE",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  previewCard: {
    borderRadius: "14px",
    border: "1px solid #D1E7D8",
    background: "linear-gradient(180deg, #F4FBF6 0%, #FFFFFF 100%)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  previewFrame: {
    width: "100%",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#0F172A",
    aspectRatio: "16 / 9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "contain",
    background: "#000000",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  buttonPrimary: {
    border: "none",
    borderRadius: "12px",
    background: "#11A94D",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: "13px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  buttonSecondary: {
    border: "1px solid #9CA3AF",
    borderRadius: "12px",
    background: "#FFFFFF",
    color: "#1F2937",
    fontWeight: 600,
    fontSize: "13px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
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
  postItem: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  postTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "15px",
    fontWeight: 700,
  },
  postMeta: {
    margin: 0,
    color: "#6B7280",
    fontSize: "12px",
  },
  postContent: {
    margin: 0,
    color: "#374151",
    fontSize: "13px",
    lineHeight: "19px",
    whiteSpace: "pre-wrap",
  },
  error: {
    margin: 0,
    color: "#B91C1C",
    fontSize: "13px",
    fontWeight: 600,
  },
  success: {
    margin: 0,
    color: "#047857",
    fontSize: "13px",
    fontWeight: 600,
  },
};

function toStatusStyle(status: PostSummary["status"]): React.CSSProperties {
  if (status === "approved") {
    return { ...styles.statusChip, color: "#065F46", background: "#D1FAE5" };
  }

  if (status === "rejected") {
    return { ...styles.statusChip, color: "#991B1B", background: "#FEE2E2" };
  }

  return { ...styles.statusChip, color: "#92400E", background: "#FEF3C7" };
}

function toMediaTypeFromType(type: PostType): "JPG" | "MP4" {
  return type === "video" ? "MP4" : "JPG";
}

export default function GreenUpload() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("community");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authUserId = useAuthStore((state) => state.user?.user_id ?? "");
  const activeUserId = authUserId || (typeof window !== "undefined" ? window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "" : "");

  const loadMyPosts = async () => {
    if (!activeUserId) {
      setError("Không tìm thấy user_id. Vui lòng đăng nhập trước.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/community/posts?userId=${encodeURIComponent(activeUserId)}`);
      const data = (await response.json()) as PostSummary[] | { error: string };

      if (!response.ok || !Array.isArray(data)) {
        const messageText = !Array.isArray(data) && "error" in data ? data.error : "Không thể tải danh sách bài đăng";
        throw new Error(messageText);
      }

      setPosts(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyPosts();
  }, [authUserId]);

  useEffect(() => {
    if (!files.length) {
      setFilePreviewUrls([]);
      return;
    }

    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setFilePreviewUrls(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const uploadAttachment = async (ownerUserId: string, postId: string, selectedFiles: File[]): Promise<string[]> => {
    const formData = new FormData();
    formData.append("userId", ownerUserId);
    formData.append("postId", postId);
    selectedFiles.forEach((selectedFile) => formData.append("files", selectedFile));

    const response = await fetch("/api/community/posts/attachment", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as { mediaUrls?: string[]; error?: string };
    if (!response.ok || !Array.isArray(data.mediaUrls)) {
      throw new Error(data.error ?? "Upload file thất bại");
    }

    return data.mediaUrls;
  };

  const onAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);

    if (!picked.length) {
      setFiles([]);
      return;
    }

    const imageCount = picked.filter((item) => item.type.startsWith("image/")).length;
    const videoCount = picked.filter((item) => item.type.startsWith("video/")).length;
    const unknownCount = picked.length - imageCount - videoCount;

    if (unknownCount > 0) {
      setError("Chỉ hỗ trợ tệp ảnh hoặc video.");
      return;
    }

    if (videoCount > 1) {
      setError("Chỉ được chọn tối đa 1 video.");
      return;
    }

    if (videoCount === 1 && imageCount > 0) {
      setError("Không thể chọn video và ảnh cùng lúc.");
      return;
    }

    setError(null);
    setFiles(picked);
  };

  const submitPost = async () => {
    if (!activeUserId) {
      setError("Không tìm thấy user_id. Vui lòng đăng nhập trước.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const createResponse = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          title,
          content,
          type,
          mediaType: toMediaTypeFromType(type),
        }),
      });

      const createData = (await createResponse.json()) as CreatedPostResult | { error?: string };
      if (!createResponse.ok || !("post_id" in createData)) {
        const errorMessage = "error" in createData ? createData.error : undefined;
        throw new Error(errorMessage ?? "Tạo bài đăng thất bại");
      }

      if (files.length) {
        await uploadAttachment(activeUserId, createData.post_id, files);
      }

      setMessage(files.length ? "Đăng bài và upload tệp thành công. Bài viết đang ở trạng thái pending." : "Đăng bài thành công. Bài viết đang ở trạng thái pending.");
      setTitle("");
      setContent("");
      setFiles([]);
      await loadMyPosts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href="/green-creators" style={styles.iconButton} aria-label="Quay lại nhà sáng tạo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.title}>Green Upload</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          <section style={styles.card}>
            {/* <p style={styles.helperText}>Theo schema posts: title, content, type và status mặc định pending.</p> */}
            <div style={styles.row}>
              <label style={styles.label} htmlFor="post-title">Tiêu đề</label>
              <input id="post-title" style={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="Nhập tiêu đề bài viết" />
            </div>

            <div style={styles.row}>
              <label style={styles.label} htmlFor="post-content">Nội dung</label>
              <textarea id="post-content" style={styles.textarea} value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} placeholder="Nhập nội dung bài viết" />
              <p style={styles.helperText}>{content.length}/1000 ký tự</p>
            </div>

            <div style={styles.row}>
              <label style={styles.label} htmlFor="post-type">Loại bài</label>
              <select id="post-type" style={styles.select} value={type} onChange={(event) => setType(event.target.value as PostType)}>
                <option value="community">community</option>
                <option value="video">video</option>
                <option value="blog">blog</option>
              </select>
            </div>

            <div style={styles.row}>
              <label style={styles.label} htmlFor="post-attachment">Tệp đính kèm (tùy chọn)</label>
              <input
                id="post-attachment"
                type="file"
                accept="image/*,video/*"
                multiple
                style={styles.input}
                onChange={onAttachmentChange}
              />
              <p style={styles.helperText}>
                {files.length ? `Đã chọn ${files.length} tệp` : "Chưa chọn tệp"}
              </p>
              {filePreviewUrls.length ? (
                <div style={styles.previewCard}>
                  <p style={styles.label}>Xem trước</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                    {filePreviewUrls.map((url, index) => {
                      const currentFile = files[index];
                      if (!currentFile) {
                        return null;
                      }

                      return (
                        <div key={`${currentFile.name}-${index}`} style={styles.previewFrame}>
                          {currentFile.type.startsWith("image/") ? (
                            <img src={url} alt={`Xem trước ${currentFile.name}`} style={styles.previewImage} />
                          ) : currentFile.type.startsWith("video/") ? (
                            <video src={url} controls playsInline preload="metadata" style={styles.previewVideo} />
                          ) : (
                            <p style={{ ...styles.helperText, color: "#FFFFFF", textAlign: "center", padding: "0 12px" }}>
                              Không hỗ trợ xem trước định dạng này.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                style={{ ...styles.buttonPrimary, ...(loading ? styles.disabledButton : {}) }}
                disabled={loading}
                onClick={() => void submitPost()}
              >
                Đăng bài
              </button>
              <button
                type="button"
                style={{ ...styles.buttonSecondary, ...(loading ? styles.disabledButton : {}) }}
                disabled={loading}
                onClick={() => void loadMyPosts()}
              >
                Tải bài của tôi
              </button>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
            {message ? <p style={styles.success}>{message}</p> : null}
          </section>

          <section style={styles.card}>
            <p style={styles.label}>Bài đăng của tôi</p>
            {posts.length === 0 ? <p style={styles.helperText}>Chưa có bài viết nào.</p> : null}
            {posts.map((post) => (
              <article key={post.post_id} style={styles.postItem}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <h2 style={styles.postTitle}>{post.title}</h2>
                  <span style={toStatusStyle(post.status)}>{post.status}</span>
                </div>
                <p style={styles.postMeta}>type: {post.type} | {new Date(post.created_at).toLocaleString("vi-VN")}</p>
                <p style={styles.postContent}>{post.content}</p>
              </article>
            ))}
          </section>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
