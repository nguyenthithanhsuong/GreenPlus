"use client";

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

export default function BackendAuthTestPage() {
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [activeUserId, setActiveUserId] = useState("");
  const [activeAccessToken, setActiveAccessToken] = useState("");

  useEffect(() => {
    const current = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    const accessToken = window.localStorage.getItem(BACKEND_TEST_ACCESS_TOKEN_STORAGE_KEY)?.trim() ?? "";
    setActiveUserId(current);
    setActiveAccessToken(accessToken);
  }, []);

  const run = async (path: string, method: string, body?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
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
      if (path === "/api/auth/sign-in") {
        const signInData = data as SignInResult;
        const userId = signInData.user?.user_id ?? signInData.user?.id;
        const accessToken = signInData.session?.access_token ?? signInData.session?.session_id;
        if (userId) {
          window.localStorage.setItem(BACKEND_TEST_USER_STORAGE_KEY, userId);
          setActiveUserId(userId);
        }
        if (accessToken) {
          window.localStorage.setItem(BACKEND_TEST_ACCESS_TOKEN_STORAGE_KEY, accessToken);
          setActiveAccessToken(accessToken);
        }
      }
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const requireUserId = (): string => {
    const userId = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    if (!userId) {
      throw new Error("Please sign in first to get user id");
    }

    return userId;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Backend Test: Customer Auth and Account</h1>
        <p className="text-sm text-slate-600">Tests use case Register, Sign In, and Manage Customer Account.</p>
        <p className="text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>
        <p className="text-xs text-slate-500">Access token: {activeAccessToken ? "available" : "not set"}</p>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Register</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="name" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="email" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="password" type="password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={registerConfirm} onChange={(e) => setRegisterConfirm(e.target.value)} placeholder="confirm password" type="password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button
            onClick={() => void run("/api/auth/register", "POST", {
              name: registerName,
              email: registerEmail,
              password: registerPassword,
              confirmPassword: registerConfirm,
            })}
            disabled={loading}
            className="mt-3 rounded bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            Register
          </button>
        </section>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Sign In</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} placeholder="email" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} placeholder="password" type="password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button
            onClick={() => void run("/api/auth/sign-in", "POST", {
              email: signInEmail,
              password: signInPassword,
            })}
            disabled={loading}
            className="mt-3 rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            Sign In
          </button>
        </section>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Manage Profile</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="name" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="phone" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} placeholder="address" className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                try {
                  const userId = requireUserId();
                  void run(`/api/account/profile?userId=${encodeURIComponent(userId)}`, "GET");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Missing user");
                }
              }}
              disabled={loading}
              className="rounded bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Load Profile
            </button>
            <button
              onClick={() => {
                try {
                  const userId = requireUserId();
                  void run("/api/account/profile", "PUT", {
                    userId,
                    name: profileName,
                    phone: profilePhone,
                    address: profileAddress,
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Missing user");
                }
              }}
              disabled={loading}
              className="rounded bg-amber-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Update Profile
            </button>
          </div>
        </section>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Change Password</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="current password" type="password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="new password" type="password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="confirm password" type="password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button
            onClick={() => {
              try {
                const userId = requireUserId();
                void run("/api/account/change-password", "PUT", {
                  userId,
                  currentPassword,
                  newPassword,
                  confirmPassword,
                });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Missing user");
              }
            }}
            disabled={loading}
            className="mt-3 rounded bg-rose-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            Change Password
          </button>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result !== null && <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}
