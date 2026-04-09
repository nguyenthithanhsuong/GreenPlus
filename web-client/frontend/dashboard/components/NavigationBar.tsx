"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { SCREEN_MAX_WIDTH_PX, SCREEN_SIDE_PADDING_PX } from "../../shared/screen.styles";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

const activeColor = "#11A94D";

const styles: {
  navBar: React.CSSProperties;
  navList: React.CSSProperties;
  navItem: React.CSSProperties;
  iconWrapper: React.CSSProperties;
  label: React.CSSProperties;
} = {
  navBar: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 0,
    zIndex: 1000,
    width: `calc(100% - (${SCREEN_SIDE_PADDING_PX} * 2))`,
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "80px",
    backgroundColor: "#FFFFFF",
    borderTop: "1px solid #EAEAEA",
    borderLeft: "1px solid #EAEAEA",
    borderRight: "1px solid #EAEAEA",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px))",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  navList: {
    width: "100%",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minWidth: "56px",
    color: "#4B5563",
    fontSize: "12px",
    fontWeight: 500,
  },
  iconWrapper: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    lineHeight: 1,
  },
};

const navItems: NavItem[] = [
  {
    label: "Trang chủ",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 10v10h5v-6h4v6h5V10" />
      </svg>
    ),
  },
  {
    label: "Danh Mục",
    href: "/category",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M4 6h7" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
        <circle cx="17" cy="6" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Đơn hàng",
    href: "/orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" />
        {/* <rect x="3" y="5" width="18" height="14" rx="2" style={{ transform: "translate(0, -2)", opacity: 0.3 }} /> */}
      </svg>
    ),
  },
  {
    label: "Green Creator",
    href: "/green-creators",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    ),
  },
  {
    label: "Hồ sơ",
    href: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
];

const NavigationBar = () => {
  const pathname = usePathname();

  return (
    <nav style={styles.navBar}>
      <div style={styles.navList}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                ...styles.navItem,
                color: isActive ? activeColor : "#4B5563",
                fontWeight: isActive ? 700 : 500,
              }}
            >
              <div style={{ ...styles.iconWrapper, color: isActive ? activeColor : "#111827" }}>{item.icon}</div>
              <span style={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationBar;
