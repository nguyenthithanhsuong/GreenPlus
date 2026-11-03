"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "../../src/lib/stores/authStore";
import { asPortalRole } from "@/lib/portal-access";

type Mode = "supabase" | "docker";
export default function StorageModeSetting() {
  const role = asPortalRole(useAuthStore((s) => s.user?.role_name ?? s.session?.role_name));
  const [mode, setMode] = useState<Mode>("supabase");
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (role !== "admin") return;
    let active = true;
    fetch("/api/settings/storage-mode", { cache: "no-store" })
      .then(async (res) => { const value = await res.json(); if (!res.ok) throw new Error(value.error || "Cannot read mode"); return value; })
      .then((value) => { if (active) { setMode(value.mode); setConfigured(Boolean(value.dockerConfigured)); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Cannot read mode"); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [role]);
  if (role !== "admin") return null;
  async function toggle() {
    const next: Mode = mode === "supabase" ? "docker" : "supabase";
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/settings/storage-mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: next }) });
      const value = await res.json();
      if (!res.ok) throw new Error(value.error || "Cannot change mode");
      setMode(value.mode);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Cannot change mode"); }
    finally { setBusy(false); }
  }
  return <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold text-slate-900">Nguồn dữ liệu</h2>
        <p className="text-sm text-slate-600">{mode === "docker" ? "Docker Local" : "Supabase Online"}</p>
      </div>
      <button type="button" role="switch" aria-label="Docker Local" aria-checked={mode === "docker"}
        disabled={busy || (mode === "supabase" && !configured)} onClick={toggle}
        className={`relative h-7 w-12 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mode === "docker" ? "bg-emerald-600" : "bg-slate-300"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${mode === "docker" ? "left-6" : "left-1"}`} />
      </button>
    </div>
    {mode === "docker" && <Link className="mt-2 inline-block text-sm text-emerald-700 underline" href="/settings/tenant-demo">Quản lý Docker</Link>}
    {!configured && <p className="mt-2 text-xs text-slate-500">Docker chưa được cấu hình trong Admin.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
