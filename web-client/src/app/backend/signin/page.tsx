"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";
const BACKEND_TEST_ACCESS_TOKEN_STORAGE_KEY = "backend-testing-access-token";

type SignInResult = {
  session: {
    session_id?: string;
    access_token?: string;
  } | null;
  user: {
    id?: string;
    user_id?: string;
    email?: string;
  } | null;
};

export default function BackendSignInTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeUserId, setActiveUserId] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    const savedToken = window.localStorage.getItem(BACKEND_TEST_ACCESS_TOKEN_STORAGE_KEY)?.trim() ?? "";
    setActiveUserId(savedUserId);
    setActiveToken(savedToken);
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Sign in request failed";
        throw new Error(message);
      }

      setResult(data);

      const signInData = data as SignInResult;
      const userId = signInData.user?.user_id ?? signInData.user?.id ?? "";
      const token = signInData.session?.access_token ?? signInData.session?.session_id ?? "";

      if (userId) {
        window.localStorage.setItem(BACKEND_TEST_USER_STORAGE_KEY, userId);
        setActiveUserId(userId);
      }

      if (token) {
        window.localStorage.setItem(BACKEND_TEST_ACCESS_TOKEN_STORAGE_KEY, token);
        setActiveToken(token);
      }
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h1 className="text-2xl font-bold">Backend Test: Sign In</h1>
          <p className="mt-2 text-sm text-slate-600">Use this page to test /api/auth/sign-in.</p>
          <p className="mt-1 text-xs text-slate-500">Route: /backend/signin</p>
          <p className="mt-1 text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>
          <p className="mt-1 text-xs text-slate-500">Stored token/session id: {activeToken ? "available" : "not set"}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/backend/register" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Go to Register Test
            </Link>
            <Link href="/backend/profile" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Go to Profile Test
            </Link>
            <Link href="/backend/products" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Product Backend Test
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Sign In Form</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password"
              type="password"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => void submit()}
            disabled={loading}
            className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result !== null && (
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
