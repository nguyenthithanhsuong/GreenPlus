"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BrainCircuit, CircleUserRound, CircleHelp, ClipboardList, Leaf, MessageCircleMore, MessageSquareText, ScanLine, UserRound } from "lucide-react";
import NavigationBar from "../dashboard/NavigationBar";

/** Icons are resolved inside this Client Component, so server pages only pass strings. */
const headingIcons = {
  help: CircleHelp,
  message: MessageCircleMore,
  ai: BrainCircuit,
  support: MessageSquareText,
  orders: ClipboardList,
  profile: UserRound,
  scan: ScanLine,
} as const;

/** Same mobile-width white canvas on a full-viewport green backdrop as Web Client. */
export default function ShipperShell({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  /** Serializable identifier so server pages never pass component functions across RSC. */
  icon: keyof typeof headingIcons;
  action?: ReactNode;
  children: ReactNode;
}) {
  const HeaderIcon = headingIcons[icon];
  return (
    <div className="gp-app">
      <div className="gp-phone-frame">
        <header className="gp-topbar">
          <Link
            href="/"
            className="gp-brand"
            aria-label="GreenPlus Shipper - Đơn giao"
          >
            <span className="gp-brand-icon">
              <Leaf size={19} strokeWidth={2.5} />
            </span>
            <span>
              <strong>GreenPlus</strong>
              <small>SHIPPER</small>
            </span>
          </Link>
          <div className="flex items-center gap-2"><Link href="/help" className="gp-account-link" aria-label="Trợ giúp"><CircleHelp size={21}/></Link>
          <Link
            href="/profile"
            className="gp-account-link"
            aria-label="Hồ sơ cá nhân"
          >
            <CircleUserRound size={22} />
          </Link></div>
        </header>
        <main className="gp-content">
          <div className="gp-page-heading">
            <div className="gp-page-heading-main">
              <span className="gp-heading-icon">
                <HeaderIcon size={20} />
              </span>
              <div>
                <h1>{title}</h1>
                <p>{description}</p>
              </div>
            </div>
            {action && <div className="gp-page-action">{action}</div>}
          </div>
          {children}
        </main>
      </div>
      <nav className="gp-mobile-navigation" aria-label="Điều hướng chính">
        <NavigationBar mode="mobile" />
      </nav>
    </div>
  );
}
