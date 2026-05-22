"use client";

import { useRouter } from "next/navigation";
import { useCurrentUserProfile } from "./useCurrentUserProfile";

export default function AdminHeader() {
  const router = useRouter();
  const { profile } = useCurrentUserProfile();

  const handleGoToSettings = () => {
    router.push("/settings");
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-8 shrink-0">
      
      <div className="ml-auto flex items-center gap-6">
        
        {/* <button
          className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
        </button> */}

        {/* Removed ml-auto from here, it's no longer needed */}
        <button
          type="button"
          onClick={handleGoToSettings}
          className="flex items-center gap-3 border-l border-gray-100 pl-6 text-left transition-opacity hover:opacity-80"
          aria-label="Đi đến cài đặt"
        >
          <img
            src={profile?.imageUrl ?? "https://i.pravatar.cc/150?u=greenplus-default-user"}
            alt={profile ? `Avatar của ${profile.name}` : "User avatar"}
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {profile?.name ?? "Người dùng"}
            </p>
            <p className="text-xs text-gray-500">{profile?.roleName ?? "Admin"}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
