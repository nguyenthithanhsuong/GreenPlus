"use client";

import { useState } from "react";

type BlogPost = {
  post_id: string;
  title: string;
  status: string;
  created_at: string;
  excerpt?: string;
  content?: string;
  image_url?: string | null;
};

type BlogListResponse = {
  items: BlogPost[];
};

export default function BlogTestPage() {
  const [postId, setPostId] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPublishedBlogs = async () => {
    setLoading(true);
    setError(null);
    setSelectedPost(null);

    try {
      const response = await fetch("/api/blogs");
      const data = (await response.json()) as BlogListResponse | { error: string };
      if (!response.ok) {
        const message = "error" in data ? String(data.error) : "Request failed";
        throw new Error(message);
      }

      setPosts((data as BlogListResponse).items ?? []);
    } catch (requestError) {
      setPosts([]);
      setSelectedPost(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const loadBlogDetail = async (inputPostId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const resolvedPostId = (inputPostId ?? postId).trim();
      if (!resolvedPostId) {
        throw new Error("postId is required");
      }

      const response = await fetch(`/api/blogs/${encodeURIComponent(resolvedPostId)}`);
      const data = (await response.json()) as BlogPost | { error: string };
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Request failed";
        throw new Error(message);
      }

      setSelectedPost(data as BlogPost);
    } catch (requestError) {
      setSelectedPost(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: View Nutrition Blog</h1>
        <p className="text-sm text-slate-600">Route tests via /api/blogs and /api/blogs/[postId].</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={postId} onChange={(e) => setPostId(e.target.value)} placeholder="postId" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void loadPublishedBlogs()} disabled={loading} className="rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Load Published Blogs</button>
            <button onClick={() => void loadBlogDetail()} disabled={loading} className="rounded bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Load Blog Detail</button>
          </div>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}

        {selectedPost && (
          <article className="overflow-hidden rounded border border-slate-300 bg-white">
            {selectedPost.image_url ? (
              <img src={selectedPost.image_url} alt={selectedPost.title} className="h-56 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-slate-200 text-xs text-slate-600">No image URL found in post content</div>
            )}
            <div className="space-y-3 p-4">
              <h2 className="text-xl font-semibold text-slate-900">{selectedPost.title}</h2>
              <p className="text-xs text-slate-500">
                {new Date(selectedPost.created_at).toLocaleString()} | status: {selectedPost.status}
              </p>
              {selectedPost.image_url && <p className="text-xs text-slate-600">image_url: {selectedPost.image_url}</p>}
              <p className="whitespace-pre-wrap text-sm text-slate-700">{selectedPost.content ?? selectedPost.excerpt ?? "No content"}</p>
            </div>
          </article>
        )}

        {posts.length > 0 && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <article key={post.post_id} className="overflow-hidden rounded border border-slate-300 bg-white">
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-slate-200 text-xs text-slate-600">No image URL found in content</div>
                )}
                <div className="space-y-2 p-4">
                  <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
                  <p className="text-xs text-slate-500">
                    {new Date(post.created_at).toLocaleString()} | status: {post.status}
                  </p>
                  {post.image_url && <p className="truncate text-xs text-slate-600">image_url: {post.image_url}</p>}
                  <p className="text-sm text-slate-700">{post.excerpt ?? "No excerpt"}</p>
                  <button
                    onClick={() => {
                      setPostId(post.post_id);
                      void loadBlogDetail(post.post_id);
                    }}
                    className="rounded bg-blue-700 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Open Post
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
