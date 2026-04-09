"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type CommunityPostItem = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  media_type: "JPG" | "PNG" | "MP4";
  media_url: string | null;
  type: "community" | "video";
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #F3F7F2 0%, #EEF4EE 100%)",
    padding: "24px",
    color: "#0F172A",
  },
  shell: {
    maxWidth: "960px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    borderRadius: "20px",
    border: "1px solid #D8E5D9",
    background: "#FFFFFF",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  },
  mediaFrame: {
    width: "100%",
    aspectRatio: "16 / 9",
    background: "#0F172A",
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
};

export default function CommunityPostDetailsPage() {
  const params = useParams<{ postId: string }>();
  const postId = useMemo(() => {
    const raw = params?.postId;
    return Array.isArray(raw) ? raw[0] : raw ?? "";
  }, [params]);

  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const post = posts.find((item) => item.post_id === postId) ?? null;

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError("Missing post ID");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/community/posts?scope=all");
        const data = (await response.json()) as CommunityPostItem[] | { error: string };

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(!Array.isArray(data) && "error" in data ? data.error : "Failed to load posts");
        }

        setPosts(data);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [postId]);

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Post Details</h1>
            <p className="text-sm text-slate-600">Dedicated post view with media rendering.</p>
          </div>
          <Link href="/backend/products/community" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Back to Posts
          </Link>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading post details...</p> : null}
        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

        {post ? (
          <article style={styles.card}>
            <div style={styles.mediaFrame}>
              {post.media_url ? (
                post.media_type === "MP4" ? (
                  <video src={post.media_url} controls playsInline preload="metadata" style={styles.mediaVideo} />
                ) : (
                  <img src={post.media_url} alt={post.title} style={styles.mediaImage} />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-600">
                  No media URL found
                </div>
              )}
            </div>

            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">{post.title}</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {post.status}
                </span>
              </div>

              <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                <p>post_id: {post.post_id}</p>
                <p>media_type: {post.media_type}</p>
                <p>type: {post.type}</p>
                <p>{new Date(post.created_at).toLocaleString("vi-VN")}</p>
              </div>

              {post.media_url ? <p className="break-all text-sm text-slate-600">media_url: {post.media_url}</p> : null}
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.content || "No content"}</p>
            </div>
          </article>
        ) : null}

        {!loading && !error && !post ? <p className="text-sm text-slate-600">Post not found.</p> : null}
      </div>
    </main>
  );
}