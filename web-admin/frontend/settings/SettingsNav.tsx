"use client";

import React from "react";
import Link from "next/link";
import { Truck } from "lucide-react";

import { LogOut } from "lucide-react";
import { supabase } from "../../src/lib/supabaseClient";
import { useAuthStore } from "../../src/lib/stores/authStore";


const SettingsNav = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState("");

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    setLogoutError("");
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Không thể kết thúc phiên đăng nhập.");
      await supabase.auth.signOut().catch(() => undefined);
      clearAuth();
      window.location.replace("/login");
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Đăng xuất thất bại.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full">
      <Link href="/help" className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-emerald-800 transition hover:bg-emerald-50">? Trung tâm trợ giúp</Link>
      <Link href="/settings/shipping" className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-emerald-800 transition hover:bg-emerald-50"><Truck size={18}/> Cấu hình phí vận chuyển</Link>
      {logoutError ? <p role="alert" className="px-4 text-sm text-red-700">{logoutError}</p> : null}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <LogOut className="w-4 h-4" />
        {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
    </div>
  );
};

export default SettingsNav;
