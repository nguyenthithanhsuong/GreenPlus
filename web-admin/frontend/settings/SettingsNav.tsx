"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Bell, LogOut, User } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { useAuthStore } from '../../src/lib/stores/authStore';
import { usePermissions } from '@/lib/usePermissions';
import { useCurrentUserProfile } from '../shared/useCurrentUserProfile';

const SettingsNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { hasPermission, loading: permLoading } = usePermissions();
  const { profile } = useCurrentUserProfile();

  const goTo = (href: string) => {
    router.push(href);
  };

  const getItemClassName = (isActive: boolean) => {
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${
      isActive ? 'bg-emerald-50 text-[#059669]' : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  const isExactOrNestedPath = (basePath: string) => {
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      clearAuth();
      await fetch('/api/auth/sync?portal=1', { method: 'DELETE' }).catch(() => undefined);
      setIsLoggingOut(false);
      window.location.replace('/login');
    }
  };

  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => goTo('/settings')}
        className={getItemClassName(pathname === '/settings')}
      >
        <User className="w-4 h-4" />
        Hồ sơ cá nhân
      </button>
      
      <button
        type="button"
        onClick={() => goTo('/settings/store')}
        className={getItemClassName(isExactOrNestedPath('/settings/store'))}
      >
        <Building2 className="w-4 h-4" />
        Cửa hàng của tôi
      </button>
      {
        // show 'Các cửa hàng' only when user has stores.read permission
      }
      {!permLoading && profile?.roleName?.toLowerCase()?.includes('admin') && (
        <button
          type="button"
          onClick={() => goTo('/settings/stores')}
          className={getItemClassName(isExactOrNestedPath('/settings/stores'))}
        >
          <Building2 className="w-4 h-4" />
          Các cửa hàng
        </button>
      )}
      
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