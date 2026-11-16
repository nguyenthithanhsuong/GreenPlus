"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Explicit refresh for client-side lists (via greenplus:data-updated) and RSC. */
export default function RefreshPageButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    window.dispatchEvent(new Event("greenplus:data-updated"));
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 900);
  };
  return <button type="button" onClick={refresh} disabled={refreshing}
    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
    title="Tải lại dữ liệu trang" aria-label="Làm mới dữ liệu">
    <RefreshCw size={16} aria-hidden="true" className={refreshing ? "animate-spin" : ""}/>
    Làm mới
  </button>;
}
