"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Eye, EyeOff } from "lucide-react";
import { logger } from "@/lib/logger"; 


type AuthMode = "login" | "register";

type AuthScreenProps = {
  mode: AuthMode;
};

function getAuthCopy(mode: AuthMode) {
  return mode === "login"
    ? {
        title: "Đăng nhập",
        subtitle: "Chào mừng quay trở lại! Để tiếp tục dùng GreenPlus, vui lòng đăng nhập.",
        submitLabel: "Đăng nhập",
        toggleLabel: "Tạo tài khoản",
        toggleHref: "/register",
        routeLabel: "Đăng nhập quản trị",
        panelHeadline: "Trang web thương mại thực phẩm GreenPlus",
        panelText:
          "GreenPlus quản lý cơ sở dữ liệu và hệ thống chính của GreenPlus.",
      }
    : {
        title: "Đăng ký",
        subtitle:
          "Tạo tài khoản và chọn vai trò phù hợp với quy trình làm việc của bạn.",
        submitLabel: "Đăng ký",
        toggleLabel: "Quay lại đăng nhập",
        toggleHref: "/login",
        routeLabel: "Đăng ký quản trị",
        panelHeadline: "Thiết lập đúng ngay từ đầu",
        panelText:
          "Nhập tên, email, mật khẩu và vai trò để phiên làm việc đầu tiên có đúng bối cảnh.",
      };
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const isLogin = mode === "login";
  const copy = getAuthCopy(mode);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => Boolean(state.session));
  const initialized = useAuthStore((state) => state.initialized);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    const start = Date.now();

    if (isLogin) {
      logger.info("Admin login attempt", { email });
    } else {
      logger.info("Admin register attempt", { email, name });
    }

    const response = await fetch(
      isLogin ? "/api/auth/sign-in" : "/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : { name, email, password, confirmPassword }
        ),
      }
    );

    const data = (await response.json().catch(() => null)) as unknown;
    const duration_ms = Date.now() - start;

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null && "error" in data
          ? String((data as { error: string }).error)
          : isLogin
          ? "Không thể đăng nhập."
          : "Không thể đăng ký.";
      logger.error(isLogin ? "Admin login failed" : "Admin register failed", {
        email,
        message,
        status: response.status,
        duration_ms,
      });
      throw new Error(message);
    }

    if (isLogin && typeof data === "object" && data !== null) {
      const payload = data as {
        session?: {
          session_id: string;
          user_id: string;
          login_time: string;
          role_name?: string | null;
          access_token?: string;
        };
        user?: {
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          image_url?: string | null;
          status?: string;
          role_name?: string | null;
        };
        role_name?: string | null;
      };

      const session = payload.session ?? null;
      const user = payload.user ?? null;
      const roleName = String(payload.role_name ?? user?.role_name ?? "")
        .trim()
        .toLowerCase();

      const allowedRoles = ["admin", "manager", "employee"];

      if (!allowedRoles.includes(roleName)) {
        logger.warn("Admin login blocked: insufficient role", {
          email,
          roleName,
          duration_ms,
        });
        throw new Error("Chỉ quản trị viên, quản lý hoặc nhân viên mới có thể truy cập cổng này.");
      }

      if (!session || !user) {
        logger.error("Admin login failed: missing session data", {
          email,
          hasSession: !!session,
          hasUser: !!user,
          duration_ms,
        });
        throw new Error("Phản hồi đăng nhập thiếu dữ liệu phiên.");
      }

      logger.info("Admin login success", { email, roleName, duration_ms });

      setAuth(
        { ...session, role_name: roleName },
        {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone ?? null,
          address: user.address ?? null,
          image_url: user.image_url ?? null,
          status: user.status ?? "active",
          role_name: roleName,
        }
      );

      router.replace("/dashboard");
      return;
    }

    logger.info("Admin register success", { email, duration_ms });
    setSuccess(isLogin ? "Đăng nhập thành công." : "Tài khoản đã được tạo thành công.");

  } catch (submitError) {
    logger.error("Admin auth unexpected error", {
      error: submitError instanceof Error ? submitError.message : String(submitError),
      mode,
      email,
    });
    setSuccess(null);
    setError(
      submitError instanceof Error
        ? submitError.message
        : "Đã xảy ra lỗi không mong muốn."
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
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên đầy đủ của bạn"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Mật khẩu
                  </label>
                  <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Xác nhận mật khẩu"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? "Vui lòng chờ..." : copy.submitLabel}
                </button>
              </form>

              {/* <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {isLogin
                    ? "Chưa có tài khoản?"
                    : "Đã có tài khoản?"}
                </p>
                <Link
                  href={copy.toggleHref}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-600 underline"
                >
                  {copy.toggleLabel}
                </Link>
              </div> */}

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