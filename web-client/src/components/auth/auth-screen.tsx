"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import ConfirmActionDialog from "../../../frontend/shared/ConfirmActionDialog";
import { useAuthStore } from "@/lib/stores/authStore";
import { Eye, EyeOff } from "lucide-react";
import { logger } from "../../../../packages/supabase-shared/src/logger";

type AuthMode = "login" | "register";

type AuthScreenProps = {
  mode: AuthMode;
};

function getAuthCopy(mode: AuthMode) {
  return mode === "login"
    ? {
        title: "Đăng nhập",
        subtitle: "Chào mừng bạn quay lại. Đăng nhập để tiếp tục vào GreenPlus.",
        submitLabel: "Đăng nhập",
        toggleLabel: "Tạo tài khoản",
        toggleHref: "/register",
        routeLabel: "Đăng nhập khách hàng",
        panelHeadline: "Truy cập nhanh cho người dùng quay lại",
        panelText:
          "Dùng thông tin đăng nhập hiện có để quay lại bảng điều khiển, đơn hàng và công cụ tài khoản.",
      }
    : {
        title: "Đăng ký",
        subtitle:
          "Tạo tài khoản và chọn vai trò phù hợp với quy trình làm việc của bạn.",
        submitLabel: "Đăng ký",
        toggleLabel: "Quay lại đăng nhập",
        toggleHref: "/login",
        routeLabel: "Đăng ký khách hàng",
        panelHeadline: "Thiết lập tài khoản đúng ngay từ đầu",
        panelText:
          "Nhập tên, email, mật khẩu và vai trò để phiên làm việc đầu tiên có đúng bối cảnh.",
      };
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const isLogin = mode === "login";
  const copy = getAuthCopy(mode);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialized = useAuthStore((state) => state.initialized);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [bannedDialogOpen, setBannedDialogOpen] = useState(false);

  useEffect(() => {
    if (initialized && isAuthenticated && isLogin) {
      router.replace("/dashboard");
    }
  }, [initialized, isAuthenticated, isLogin, router]);

  const applyLoginResponse = (data: unknown) => {
    if (typeof data !== "object" || data === null) {
      throw new Error("Phản hồi đăng nhập không hợp lệ.");
    }

    const payload = data as {
      session?: {
        session_id?: string;
        user_id?: string;
        login_time?: string;
      } | null;
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

    if (!sessionId || !userId || !payload.user) {
      throw new Error("Phản hồi đăng nhập không hợp lệ.");
    }

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
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    if (isLogin) {
      logger.info("Login attempt", { email });
      const start = Date.now();

      const signInResponse = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const signInData = (await signInResponse.json().catch(() => null)) as unknown;
      const duration_ms = Date.now() - start;

      if (!signInResponse.ok) {
        const message =
          typeof signInData === "object" && signInData !== null && "error" in signInData
            ? String((signInData as { error: string }).error)
            : "Không thể đăng nhập.";

        if (typeof signInData === "object" && signInData !== null && "status" in signInData) {
          const status = (signInData as { status?: string }).status;
          if (status === "banned") {
            logger.warn("Login blocked: account banned", { email });
            setBannedDialogOpen(true);
            return;
          } else if (status === "inactive" || status === "suspended") {
            logger.warn("Login blocked: account inactive/suspended", { email, status });
            setUnlockDialogOpen(true);
            return;
          }
        }

        if (message.includes("banned")) {
          logger.warn("Login blocked: banned (message)", { email });
          setBannedDialogOpen(true);
          return;
        }

        if (message.includes("account is not active")) {
          logger.warn("Login blocked: account not active (message)", { email });
          setUnlockDialogOpen(true);
          return;
        }

        logger.error("Login failed", { email, message, status: signInResponse.status, duration_ms });
        throw new Error(message);
      }

      logger.info("Login success", { email, duration_ms });
      setSuccess("Đăng nhập thành công.");
      applyLoginResponse(signInData);
      return;
    }

    logger.info("Register attempt", { email, name });
    const start = Date.now();

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    const data = (await response.json().catch(() => null)) as unknown;
    const duration_ms = Date.now() - start;

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null && "error" in data
          ? String((data as { error: string }).error)
          : "Không thể đăng ký.";
      logger.error("Register failed", { email, message, status: response.status, duration_ms });
      throw new Error(message);
    }

    logger.info("Register success", { email, duration_ms });
    setSuccess("Tài khoản đã được tạo thành công.");

  } catch (submitError) {
    if (!(submitError instanceof Error && submitError.message !== "Đã xảy ra lỗi không mong muốn.")) {
      logger.error("Unexpected auth error", {
        error: submitError instanceof Error ? submitError.message : String(submitError),
        mode,
        email,
      });
    }
    setSuccess(null);
    setError(submitError instanceof Error ? submitError.message : "Đã xảy ra lỗi không mong muốn.");
  } finally {
    setLoading(false);
  }
};

async function handleConfirmUnlock() {
  setUnlockDialogOpen(false);
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    logger.info("Unlock attempt", { email });

    const unlockResponse = await fetch("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const unlockData = (await unlockResponse.json().catch(() => null)) as unknown;
    if (!unlockResponse.ok) {
      const unlockMessage =
        typeof unlockData === "object" && unlockData !== null && "error" in unlockData
          ? String((unlockData as { error: string }).error)
          : "Không thể mở khóa tài khoản.";
      logger.error("Unlock failed", { email, message: unlockMessage, status: unlockResponse.status });
      throw new Error(unlockMessage);
    }

    logger.info("Unlock success, retrying login", { email });

    const retryResponse = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const retryData = (await retryResponse.json().catch(() => null)) as unknown;
    if (!retryResponse.ok) {
      const retryMessage =
        typeof retryData === "object" && retryData !== null && "error" in retryData
          ? String((retryData as { error: string }).error)
          : "Không thể đăng nhập.";
      logger.error("Login after unlock failed", { email, message: retryMessage });
      throw new Error(retryMessage);
    }

    logger.info("Login after unlock success", { email });
    setSuccess("Tài khoản đã được mở khóa và đăng nhập thành công.");
    applyLoginResponse(retryData);

  } catch (e) {
    logger.error("Unlock flow error", {
      error: e instanceof Error ? e.message : String(e),
      email,
    });
    setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không mong muốn.");
  } finally {
    setLoading(false);
  }
}

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
                      placeholder="Nhập họ và tên"
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
                    placeholder="Nhập email"
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
                    placeholder="Nhập mật khẩu"
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
                      placeholder="Nhập lại mật khẩu"
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

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <ConfirmActionDialog
            open={unlockDialogOpen}
            title="Tài khoản bị khóa"
            message="Tài khoản đang bị khóa. Mở khóa và đăng nhập lại?"
            confirmLabel="Mở khóa và đăng nhập"
            confirmVariant="warning"
            loading={loading}
            onCancel={() => setUnlockDialogOpen(false)}
            onConfirm={() => void handleConfirmUnlock()}
          />
          <ConfirmActionDialog
            open={bannedDialogOpen}
            title="Tài khoản bị cấm"
            message="Tài khoản của bạn đã bị cấm và không thể đăng nhập. Vui lòng liên hệ với bộ phận hỗ trợ để biết thêm thông tin."
            confirmLabel="Đóng"
            confirmVariant="danger"
            loading={false}
            onCancel={() => setBannedDialogOpen(false)}
            onConfirm={() => setBannedDialogOpen(false)}
          />
        </div>
      </div>
    </main>
  );
}
