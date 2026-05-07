"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Bell, LogOut } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { useAuthStore } from '../../src/lib/stores/authStore';

const SettingsNav = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    const CLIENT_APP_URL = process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? 'http://localhost:3000';

    try {
      await supabase.auth.signOut();
    } finally {
      clearAuth();
      await fetch('/api/auth/sync?portal=1', { method: 'DELETE' }).catch(() => undefined);
      setIsLoggingOut(false);
      // Redirect to the shared portal login (web client). Use a full navigation
      // so the other app can handle any session/state cleanup.
      window.location.replace(CLIENT_APP_URL);
    }
  };

  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
      {/* Active Link */}
      <button className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-[#059669] rounded-xl font-bold text-sm transition-colors text-left">
        <User className="w-4 h-4" />
        Hồ sơ cá nhân
      </button>
      
      {/* Inactive Links */}
      <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors text-left">
        <Shield className="w-4 h-4" />
        Bảo mật & Mật khẩu
      </button>
      
      <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors text-left">
        <Bell className="w-4 h-4" />
        Cài đặt thông báo
      </button>
      
      {/* Separator & Logout */}
      <div className="my-2 border-t border-gray-200"></div>
      
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <LogOut className="w-4 h-4" />
        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </button>
    </div>
  );
};

export default SettingsNav;