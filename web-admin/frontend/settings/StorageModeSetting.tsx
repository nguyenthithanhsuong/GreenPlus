"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "../../src/lib/stores/authStore";
import { asPortalRole } from "@/lib/portal-access";

type Mode = "supabase" | "docker";
type ModeResponse = {
  mode: Mode;
  dockerConfigured: boolean;
  dockerReady: boolean;
  dockerLocation?: "local" | "internal" | "remote" | null;
  dockerError?: string | null;
  error?: string;
};

export default function StorageModeSetting() {
  const role = asPortalRole(useAuthStore((s) => s.user?.role_name ?? s.session?.role_name));
  const [mode, setMode] = useState<Mode>("supabase");
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useState<"local" | "internal" | "remote" | null>(null);
  const [diagnostic, setDiagnostic] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/settings/storage-mode", { cache: "no-store", signal });
      const value = (await res.json()) as ModeResponse;
      if (!res.ok) throw new Error(value.error || "Cannot read mode");
      if (signal?.aborted) return;
      setMode(value.mode);
      setConfigured(Boolean(value.dockerConfigured));
      setReady(Boolean(value.dockerReady));
      setLocation(value.dockerLocation ?? null);
      setDiagnostic(value.dockerError ?? "");
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Cannot read mode");
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (role !== "admin") return;
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [role, refresh]);
  if (role !== "admin") return null;
  async function toggle() {
    const next: Mode = mode === "supabase" ? "docker" : "supabase";
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/settings/storage-mode", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: next }),
      });
      const value = (await res.json()) as ModeResponse;
      if (!res.ok) throw new Error(value.error || "Cannot change mode");
      setMode(value.mode);
      if (next === "docker") setReady(true);
      // Pages use a server-side HttpOnly cookie; refresh to avoid stale Supabase state.
      window.location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Cannot change mode"); }
    finally { setBusy(false); }
  }
  return <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold text-slate-900">Nguồn dữ liệu</h2>
        <p className="text-sm text-slate-600">{mode === "docker" ? `Docker ${location === "remote" ? "VPS" : location === "internal" ? "Network" : "Local"}` : "Supabase Online"}</p>
      </div>
      <button type="button" role="switch" aria-label="Docker Local" aria-checked={mode === "docker"}
        disabled={busy || (mode === "supabase" && !ready)} onClick={toggle}
        className={`relative h-7 w-12 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mode === "docker" ? "bg-emerald-600" : "bg-slate-300"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${mode === "docker" ? "left-6" : "left-1"}`} />
      </button>
    </div>
    <button type="button" onClick={() => void refresh()} disabled={busy}
      className="mt-2 text-xs font-medium text-emerald-700 underline disabled:opacity-50">
      Kiểm tra lại kết nối Docker
    </button>
    {mode === "docker" && <Link className="mt-2 inline-block text-sm text-emerald-700 underline" href="/settings/stores">Quản lý tenant Docker</Link>}
    {!configured && <p className="mt-2 text-xs text-slate-500">Docker chưa được cấu hình trong Admin: {diagnostic}. Với Docker local, chạy `npm run docker:three-tier:link-admin` rồi khởi động lại Web Admin.</p>}
    {configured && !ready && <p role="status" className="mt-2 text-xs text-amber-700">Docker đã cấu hình nhưng chưa sẵn sàng: {diagnostic}</p>}
    <p className="mt-2 text-xs text-slate-500">Chế độ thử nghiệm riêng của Admin: Stores, Products, Categories, Inventory và Orders. Client/Shipper vẫn dùng Supabase; không dùng để vận hành đơn hàng production.</p>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
