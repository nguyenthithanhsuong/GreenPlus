"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCurrentUserProfile } from "./useCurrentUserProfile";
import StoreSwitcher from "./StoreSwitcher";
import ActivityNotifications from "./ActivityNotifications";

export default function AdminHeader() {
  const router = useRouter();
  const { profile } = useCurrentUserProfile();

  const handleGoToSettings = () => {
    router.push("/settings");
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-8 shrink-0">
      <div className="ml-auto flex items-center gap-3 sm:gap-6">
        <StoreSwitcher />
        <ActivityNotifications />
        <button
          type="button"
          onClick={handleGoToSettings}
          className="flex items-center gap-3 border-l border-gray-100 pl-6 text-left transition-opacity hover:opacity-80"
          aria-label="Đi đến cài đặt"
        >
          <Image unoptimized width={36} height={36}
            src={
              profile?.imageUrl ??
              "https://i.pravatar.cc/150?u=greenplus-default-user"
            }
            alt={profile ? `Avatar của ${profile.name}` : "User avatar"}
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {profile?.name ?? "Người dùng"}
            </p>
            <p className="text-xs text-gray-500">
              {profile?.roleName ?? "Admin"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
