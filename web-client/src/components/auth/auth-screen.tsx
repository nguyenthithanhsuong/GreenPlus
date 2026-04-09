"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";

type AuthMode = "login" | "register";

type AuthScreenProps = {
  mode: AuthMode;
};

function getAuthCopy(mode: AuthMode) {
  return mode === "login"
    ? {
        title: "Login",
        subtitle: "Welcome back. Sign in to continue to GreenPlus.",
        submitLabel: "Sign In",
        toggleLabel: "Create an account",
        toggleHref: "/register",
        routeLabel: "/login",
        panelHeadline: "Fast access for returning teams",
        panelText:
          "Use your existing credentials to jump back into dashboards, orders, and account tools.",
      }
    : {
        title: "Register",
        subtitle:
          "Create your account and choose the role that fits your workflow.",
        submitLabel: "Sign Up",
        toggleLabel: "Back to login",
        toggleHref: "/login",
        routeLabel: "/register",
        panelHeadline: "Onboard the right way",
        panelText:
          "Capture a name, email, password, and role so the first session starts with the right context.",
      };
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const isLogin = mode === "login";
  const copy = getAuthCopy(mode);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialized = useAuthStore((state) => state.initialized);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (initialized && isAuthenticated && isLogin) {
      router.replace("/dashboard");
    }
  }, [initialized, isAuthenticated, isLogin, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        isLogin ? "/api/auth/sign-in" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isLogin
              ? { email, password }
              : {
                  name,
                  email,
                  password,
                  confirmPassword,
                }
          ),
        }
      );

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: string }).error)
            : isLogin
            ? "Login request failed"
            : "Register request failed";
        throw new Error(message);
      }

      setSuccess(
        isLogin
          ? "Signed in successfully."
          : "Account created successfully."
      );

      if (isLogin && typeof data === "object" && data !== null) {
        const payload = data as {
          session?: { session_id?: string; user_id?: string; login_time?: string } | null;
          user?: {
            user_id?: string;
            name?: string;
            email?: string;
            phone?: string | null;
            address?: string | null;
            image_url?: string | null;
            status?: string;
          } | null;
        };

        const sessionId = payload.session?.session_id?.trim() ?? "";
        const userId = payload.session?.user_id?.trim() ?? payload.user?.user_id?.trim() ?? "";

        if (sessionId && userId && payload.user) {
          setAuth({
            session: {
              session_id: sessionId,
              user_id: userId,
              login_time: payload.session?.login_time ?? new Date().toISOString(),
            },
            user: {
              user_id: payload.user.user_id ?? userId,
              name: payload.user.name ?? "",
              email: payload.user.email ?? "",
              phone: payload.user.phone ?? null,
              address: payload.user.address ?? null,
              image_url: payload.user.image_url ?? null,
              status: payload.user.status ?? "active",
            },
            token: sessionId,
          });
          router.replace("/dashboard");
        }
      }
    } catch (submitError) {
      setSuccess(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_35%),linear-gradient(180deg,_#ecfdf5_0%,_#f8fafc_52%,_#f1f5f9_100%)] text-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:28px_28px] opacity-50" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
          
          {/* LEFT PANEL */}
          <section className="hidden flex-col justify-between bg-[linear-gradient(160deg,_#0f172a_0%,_#115e59_55%,_#10b981_100%)] p-10 text-white xl:flex">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">
                GreenPlus
              </p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">
                {copy.panelHeadline}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-emerald-50/90">
                {copy.panelText}
              </p>
            </div>

            {/* <div className="grid gap-4 rounded-[1.5rem] border border-white/15 bg-white/10 p-5 shadow-lg shadow-black/10 backdrop-blur-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-100/80">
                  Route
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {copy.routeLabel}
                </p>
              </div>
            </div> */}
          </section>

          {/* FORM PANEL */}
          <section className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {copy.routeLabel}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    {copy.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              <form className="mt-8 space-y-5" onSubmit={submit}>
                {!isLogin && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Re-enter your password"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? "Please wait..." : copy.submitLabel}
                </button>
              </form>

              {/* SINGLE TOGGLE (BOTTOM ONLY) */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {isLogin
                    ? "Need an account?"
                    : "Already have an account?"}
                </p>
                <Link
                  href={copy.toggleHref}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-600 underline"
                >
                  {copy.toggleLabel}
                </Link>
              </div>

              {error && (
                <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              {success && (
                <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}