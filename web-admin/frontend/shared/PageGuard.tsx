"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { asPortalRole, canAccessPage } from "@/lib/portal-access";
import { useAuthStore } from "@/lib/stores/authStore";

/**
 * Middleware validates the signed HttpOnly cookie on every protected navigation.
 * This component never blocks every page while rechecking the same session.
 * Server APIs still enforce identity and tenant permissions independently.
 */
type Verification = { identity: string; validUntil: number };
let lastVerified: Verification | null = null;
let pending: { identity: string; promise: Promise<{ userId: string; role: string } | "invalid" | "unavailable"> } | null = null;
const VERIFY_INTERVAL_MS = 45_000;

async function verifySession(identity: string) {
  if (!pending || pending.identity !== identity) {
    const promise = (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
        if (response.status === 401 || response.status === 403) return "invalid" as const;
        if (!response.ok) return "unavailable" as const;
        const result = await response.json() as { userId?: string; role?: string };
        return typeof result.userId === "string" && typeof result.role === "string"
          ? { userId: result.userId, role: result.role }
          : "invalid" as const;
      } catch { return "unavailable" as const; }
    })();
    pending = { identity, promise };
    void promise.finally(() => { if (pending?.promise === promise) pending = null; });
  }
  return pending.promise;
}

export default function PageGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useAuthStore(s => s.initialized);
  const session = useAuthStore(s => s.session);
  const user = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);
  const role = asPortalRole(user?.role_name ?? session?.role_name);
  const token = session?.access_token ?? "";
  const userId = user?.user_id ?? session?.user_id ?? "";
  const identity = `${userId}:${role ?? ""}:${token}`;
  const allowed = Boolean(role && canAccessPage(role, pathname));
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!role || !userId || !token) { lastVerified = null; router.replace("/login"); return; }
    if (!allowed) return;
    let active = true;
    const check = async () => {
      if (lastVerified?.identity === identity && lastVerified.validUntil > Date.now()) return;
      const result = await verifySession(identity);
      if (!active) return;
      if (result === "invalid" || (typeof result === "object" && (result.userId !== userId || result.role !== role))) {
        lastVerified = null;
        clearAuth();
        router.replace("/login");
        return;
      }
      if (result === "unavailable") { setWarning(true); return; }
      lastVerified = { identity, validUntil: Date.now() + VERIFY_INTERVAL_MS };
      setWarning(false);
    };
    void check();
    const onFocus = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => { active = false; document.removeEventListener("visibilitychange", onFocus); };
  }, [initialized, role, token, userId, identity, allowed, clearAuth, router]);

  if (!initialized) return <main role="status" className="flex min-h-screen items-center justify-center text-sm text-slate-600">Đang mở phiên đăng nhập...</main>;
  if (!role || !userId || !token) return <main role="status" className="flex min-h-screen items-center justify-center text-sm text-slate-600">Đang chuyển đến đăng nhập...</main>;
  if (!allowed) return <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
    <h2 className="text-xl font-bold">Không có quyền truy cập</h2>
    <p className="text-sm text-slate-600">Tài khoản không có quyền mở trang này.</p>
    <button type="button" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white" onClick={() => router.replace("/dashboard")}>Về Dashboard</button>
  </main>;
  // Middleware authenticated this route before rendering it; avoid a second full-page spinner.
  return <>{warning && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">Tạm thời không thể kiểm tra lại phiên. Dữ liệu và thao tác vẫn được xác minh bởi server.</div>}{children}</>;
}
