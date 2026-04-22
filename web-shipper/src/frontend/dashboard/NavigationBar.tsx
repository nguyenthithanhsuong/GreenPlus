"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ScanLine, UserCircle } from "lucide-react";
import { SCREEN_MAX_WIDTH_PX, SCREEN_SIDE_PADDING_PX } from "../shared/screen.styles";

const activeColor = "#15A651";

const navItems = [
  {
    label: "Đơn hàng",
    href: "/",
    icon: List,
  },
  {
    label: "Quét QR",
    href: "/scan",
    icon: ScanLine,
  },
  {
    label: "Cá nhân",
    href: "/profile",
    icon: UserCircle,
  },
];

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 border-t border-gray-100 bg-white shadow-[0_-12px_40px_-24px_rgba(2,6,23,0.22)]"
      style={{
        width: "100%",
        maxWidth: SCREEN_MAX_WIDTH_PX,
        transform: "translateX(-50%)",
        paddingLeft: SCREEN_SIDE_PADDING_PX,
        paddingRight: SCREEN_SIDE_PADDING_PX,
        paddingBottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <div className="flex w-full items-end justify-between pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          if (item.href === "/scan") {
            return (
              <button key={item.label} className="relative -top-4 flex flex-col items-center group" type="button">
                <div className="w-14 h-14 bg-[#2A303C] rounded-full flex items-center justify-center text-white border-4 border-[#F8F9FA] shadow-lg group-active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-gray-500 mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-1.5 p-2"
              style={{ color: isActive ? activeColor : "#9CA3AF" }}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}