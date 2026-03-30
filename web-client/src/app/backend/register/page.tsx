"use client";

import Link from "next/link";
import { useState } from "react";

export default function BackendRegisterTestPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : "Register request failed";
        throw new Error(message);
      }

      setResult(data);
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
          <h1 className="text-2xl font-bold">Backend Test: Register</h1>
          <p className="mt-2 text-sm text-slate-600">Use this page to test /api/auth/register.</p>
          <p className="mt-1 text-xs text-slate-500">Route: /backend/register</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/backend/signin" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Go to Sign In Test
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
          <h2 className="text-lg font-semibold">Register Form</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="name"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
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
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="confirm password"
              type="password"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => void submit()}
            disabled={loading}
            className="mt-4 rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Register"}
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
