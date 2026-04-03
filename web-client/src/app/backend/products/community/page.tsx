"use client";

import { useEffect, useState } from "react";

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

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

export default function CommunityPostTestPage() {
  const [activeUserId, setActiveUserId] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [title, setTitle] = useState("My green living story");
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState("JPG");
  const [mediaUrl, setMediaUrl] = useState("");
  const [myPosts, setMyPosts] = useState<CommunityPostItem[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPost = myPosts.find((post) => post.post_id === selectedPostId) ?? null;

  useEffect(() => {
    const saved = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    setActiveUserId(saved);
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!activeUserId) {
        throw new Error("Please login test user from top-right corner first");
      }

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          title,
          content,
          mediaType,
          mediaUrl,
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Request failed";
        throw new Error(message);
      }

      setResult(data);
      await loadMyPosts();
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const loadMyPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!activeUserId) {
        throw new Error("Please login test user from top-right corner first");
      }

      const response = await fetch(`/api/community/posts?userId=${encodeURIComponent(activeUserId)}`);
      const data = (await response.json()) as CommunityPostItem[] | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Request failed");
      }

      const posts = data as CommunityPostItem[];
      setMyPosts(posts);
      setResult(posts);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const applyPostToForm = (post: CommunityPostItem) => {
    setSelectedPostId(post.post_id);
    setTitle(post.title ?? "");
    setContent(post.content ?? "");
    setMediaType(post.media_type ?? "JPG");
    setMediaUrl(post.media_url ?? "");
  };

  const renderMediaPreview = (post: CommunityPostItem, size: "large" | "small") => {
    const hasMedia = Boolean(post.media_url);
    const isVideo = post.media_type === "MP4";
    const mediaUrlValue = post.media_url ?? "";
    const mediaHeightClass = size === "large" ? "h-56" : "h-40";

    if (!hasMedia) {
      return (
        <div className={`flex ${mediaHeightClass} w-full items-center justify-center bg-slate-200 text-xs text-slate-600`}>
          No media URL found
        </div>
      );
    }

    if (isVideo) {
      return <video src={mediaUrlValue} controls className={`${mediaHeightClass} w-full bg-slate-900 object-cover`} />;
    }

    return <img src={mediaUrlValue} alt={post.title} className={`${mediaHeightClass} w-full object-cover`} />;
  };

  const updateSelectedPost = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!activeUserId) {
        throw new Error("Please login test user from top-right corner first");
      }

      if (!selectedPostId) {
        throw new Error("Select one post from My Posts before editing");
      }

      const response = await fetch("/api/community/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          postId: selectedPostId,
          title,
          content,
          mediaType,
          mediaUrl,
        }),
      });

      const data = (await response.json()) as CommunityPostItem | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Request failed");
      }

      setResult(data);
      await loadMyPosts();
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Post Community Content</h1>
        <p className="text-sm text-slate-600">Route test via /api/community/posts.</p>
        <p className="text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>
        <p className="text-xs text-slate-500">Selected post: {selectedPostId || "none"}</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="content <= 1000 chars" className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows={4} />
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="JPG">JPG</option>
              <option value="PNG">PNG</option>
              <option value="MP4">MP4</option>
            </select>
            <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="media url" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void submit()} disabled={loading} className="rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Create Post</button>
            <button onClick={() => void loadMyPosts()} disabled={loading} className="rounded bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Load My Posts</button>
            <button onClick={() => void updateSelectedPost()} disabled={loading} className="rounded bg-amber-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Update Selected Post</button>
          </div>
        </section>

        {selectedPost && (
          <article className="overflow-hidden rounded border border-slate-300 bg-white">
            {renderMediaPreview(selectedPost, "large")}
            <div className="space-y-3 p-4">
              <h2 className="text-lg font-semibold text-slate-900">Editing: {selectedPost.title}</h2>
              <p className="text-xs text-slate-500">
                {new Date(selectedPost.created_at).toLocaleString()} | status: {selectedPost.status}
              </p>
              <p className="text-xs text-slate-600">post_id: {selectedPost.post_id}</p>
              <p className="text-xs text-slate-600">media_type: {selectedPost.media_type}</p>
              {selectedPost.media_url && <p className="break-all text-xs text-slate-600">media_url: {selectedPost.media_url}</p>}
              <p className="whitespace-pre-wrap text-sm text-slate-700">{selectedPost.content}</p>
            </div>
          </article>
        )}

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">My Posts</h2>
          {myPosts.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No posts loaded yet. Click Load My Posts.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              {myPosts.map((post) => (
                <article key={post.post_id} className="overflow-hidden rounded border border-slate-300 bg-white">
                  {renderMediaPreview(post, "small")}
                  <div className="space-y-2 p-4">
                    <p className="text-base font-semibold text-slate-900">{post.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(post.created_at).toLocaleString()} | status: {post.status}
                    </p>
                    <p className="text-xs text-slate-600">post_id: {post.post_id}</p>
                    {post.media_url && <p className="truncate text-xs text-slate-600">media_url: {post.media_url}</p>}
                    <p className="line-clamp-3 text-sm text-slate-700">{post.content || "No content"}</p>
                    <button
                      onClick={() => applyPostToForm(post)}
                      disabled={loading}
                      className="rounded bg-emerald-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Open For Edit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result !== null && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}
