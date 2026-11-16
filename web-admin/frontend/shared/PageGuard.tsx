"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { asPortalRole, canAccessPage } from "@/lib/portal-access";
import { useAuthStore } from "@/lib/stores/authStore";

type Verification = {
  token: string;
  userId: string;
  role: string;
  validUntil: number;
};
// This cache is in-memory only, scoped to the same browser tab and verified identity.
// The signed HttpOnly cookie is STILL verified by middleware for each navigation/API.
// Cache is only an optimization for avoiding the full-screen spinner on every route.
let lastVerified: Verification | null = null;
const CHECK_INTERVAL_MS = 45_000;
function matches(value: Verification | null, token: string, userId: string, role: string) {
  return Boolean(value && value.token === token && value.userId === userId && value.role === role && value.validUntil > Date.now());
}

export default function PageGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useAuthStore(state => state.initialized);
  const session = useAuthStore(state => state.session);
  const user = useAuthStore(state => state.user);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const token = session?.access_token ?? "";
  const role = asPortalRole(user?.role_name ?? session?.role_name);
  const userId = user?.user_id ?? "";
  const [verification, setVerification] = useState<Verification | null>(() => lastVerified);
  const [unavailable, setUnavailable] = useState(false);
  const [retry, setRetry] = useState(0);
  const allowed = Boolean(role && canAccessPage(role, pathname));

  useEffect(() => {
    if (!initialized) return;
    if (!token || !userId || !role) { router.replace("/login"); return; }
    if (!allowed) return;
    const controller = new AbortController();
    const check = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 401 || response.status === 403) {
          lastVerified = null;
          clearAuth();
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("SESSION_CHECK_UNAVAILABLE");
        const data: { userId?: string; role?: string } = await response.json();
        if (controller.signal.aborted) return;
        if (data.userId !== userId || data.role !== role) {
          lastVerified = null;
          clearAuth();
          router.replace("/login");
          return;
        }
        const next = { token, userId, role, validUntil: Date.now() + CHECK_INTERVAL_MS };
        lastVerified = next;
        setVerification(next);
        setUnavailable(false);
        if (retry > 0) setRetry(0);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    };
    if (!matches(lastVerified, token, userId, role) || retry > 0) void check();
    const focus = () => {
      if (document.visibilityState === "visible" && !matches(lastVerified, token, userId, role)) void check();
    };
    document.addEventListener("visibilitychange", focus);
    return () => { controller.abort(); document.removeEventListener("visibilitychange", focus); };
  }, [initialized, token, userId, role, allowed, retry, clearAuth, router]);

  const verified = matches(verification, token, userId, role) || matches(lastVerified, token, userId, role);
  if (!initialized || !token || !userId || !role) {
    return <main role="status" className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">Đang mở phiên đăng nhập...</main>;
  }
  if (!allowed) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-5 text-center">
      <h2 className="text-xl font-bold">Không có quyền truy cập</h2>
      <p className="text-sm text-slate-600">Tài khoản không có quyền mở trang này.</p>
      <button type="button" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white" onClick={() => router.replace("/dashboard")}>Về Dashboard</button>
    </main>;
  }
  if (!verified) {
    return <main role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-sm text-slate-600">
      {unavailable ? <><p role="alert" className="text-rose-700">Không thể xác minh phiên đăng nhập. Kiểm tra kết nối rồi thử lại.</p><button type="button" onClick={() => setRetry(value => value + 1)} className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white">Thử lại</button></> : "Đang xác minh phiên đăng nhập..."}
    </main>;
  }
  return <>{children}</>;
}
