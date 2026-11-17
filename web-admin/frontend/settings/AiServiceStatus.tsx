"use client";

import { useState } from "react";
import { Activity, RefreshCw } from "lucide-react";

type Result = { status: string; message?: string };
export default function AiServiceStatus() {
  const [status, setStatus] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    try {
      const response = await fetch("/api/ai/health", { cache: "no-store", credentials: "same-origin" });
      const value = await response.json() as Result;
      setStatus(value);
    } catch { setStatus({ status: "unavailable", message: "Không gửi được yêu cầu kiểm tra AI." }); }
    finally { setBusy(false); }
  }
  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="flex items-center gap-2 font-semibold text-slate-900"><Activity size={19}/> Kết nối AI Assist</h2>
      <p className="mt-1 text-sm text-slate-500">Kiểm tra lần lượt AI container, khóa dịch vụ và dữ liệu Supabase. Chỉ dùng trong môi trường đang cấu hình.</p></div>
      <button type="button" disabled={busy} onClick={() => void check()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><RefreshCw size={16} className={busy ? "animate-spin" : ""}/> Kiểm tra kết nối AI</button>
    </div>
    {status && <p role="status" className={`mt-3 text-sm ${status.status === "ready" ? "text-emerald-700" : "text-amber-800"}`}>{status.message || "Không thể xác minh AI."}</p>}
  </section>;
}
