"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleUserRound, Leaf } from "lucide-react";
import NavigationBar from "../dashboard/NavigationBar";

/** Same mobile-width white canvas on a full-viewport green backdrop as Web Client. */
export default function ShipperShell({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="gp-app">
      <div className="gp-phone-frame">
        <header className="gp-topbar">
          <Link href="/" className="gp-brand" aria-label="GreenPlus Shipper - Đơn giao">
            <span className="gp-brand-icon"><Leaf size={19} strokeWidth={2.5} /></span>
            <span><strong>GreenPlus</strong><small>SHIPPER</small></span>
          </Link>
          <Link href="/profile" className="gp-account-link" aria-label="Hồ sơ cá nhân"><CircleUserRound size={22} /></Link>
        </header>
        <main className="gp-content">
          <div className="gp-page-heading">
            <div className="gp-page-heading-main">
              <span className="gp-heading-icon"><Icon size={20} /></span>
              <div><h1>{title}</h1><p>{description}</p></div>
            </div>
            {action && <div className="gp-page-action">{action}</div>}
          </div>
          {children}
        </main>
      </div>
      <nav className="gp-mobile-navigation" aria-label="Điều hướng chính"><NavigationBar mode="mobile" /></nav>
    </div>
  );
}
