"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ScanLine, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Đơn giao", icon: ClipboardList },
  { href: "/scan", label: "Tra cứu", icon: ScanLine },
  { href: "/profile", label: "Cá nhân", icon: UserRound },
];

export default function NavigationBar({ mode }: { mode: "desktop" | "mobile" }) {
  const pathname = usePathname();
  return (
    <div className={mode === "desktop" ? "gp-nav-desktop" : "gp-nav-mobile"}>
      {mode === "desktop" && <p className="gp-nav-heading">KHÔNG GIAN LÀM VIỆC</p>}
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`gp-nav-link ${active ? "gp-nav-link-active" : ""}`}
          >
            <Icon size={mode === "mobile" ? 21 : 20} strokeWidth={active ? 2.4 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
      {mode === "desktop" && (
        <div className="gp-nav-note"><span className="gp-nav-note-icon">✓</span>
          <strong>Dữ liệu bảo mật</strong><p>Chỉ hiển thị đơn hàng được phân công cho tài khoản của bạn.</p>
        </div>
      )}
    </div>
  );
}
