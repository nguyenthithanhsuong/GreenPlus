"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type MenuItem = {
  title: string;
  href: string;
  destructive?: boolean;
};

type ProfileResult = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  status: string;
};

const menuItems: MenuItem[] = [
  { title: "Quét QR Batch", href: "/profile/scan-batch" },
  { title: "Profile của tôi", href: "/profile/my-profile" },
  { title: "Đổi mật khẩu", href: "/profile/change-password" },
  { title: "Phương thức thanh toán", href: "/profile/payment-method" },
  { title: "Lịch sử điểm thưởng", href: "/profile/score-history" },
  { title: "Cài đặt thông báo", href: "/profile/notification-setting" },
  { title: "Trợ giúp & Hỗ trợ", href: "/profile/help" },
  { title: "Đăng xuất", href: "/login", destructive: true },
];

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    fontFamily: "'Inter', sans-serif",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  mainContent: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  hero: {
    borderRadius: "20px",
    background: "#F6FAFC",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  heroAvatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "#D7EAF1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroText: {
    margin: 0,
    fontSize: "14px",
    color: "#2E2E2E",
    fontWeight: 600,
  },
  menuCard: {
    height: "56px",
    borderRadius: "16px",
    background: "#FFFFFF",
    border: "1px solid #ECEFF2",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    textDecoration: "none",
    color: "#2E2E2E",
  },
  destructiveText: {
    color: "#B91C1C",
  },
};

export default function ProfileMenuPage() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [profile, setProfile] = useState<ProfileResult | null>(null);

  useEffect(() => {
    if (!initialized || !isAuthenticated || !user?.user_id) {
      return;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/account/profile?userId=${encodeURIComponent(user.user_id)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as ProfileResult | { error?: string };

        if (!response.ok) {
          return;
        }

        const nextProfile = data as ProfileResult;
        setProfile(nextProfile);
        updateUser({
          name: nextProfile.name,
          email: nextProfile.email,
          phone: nextProfile.phone,
          address: nextProfile.address,
          image_url: nextProfile.image_url,
          status: nextProfile.status,
        });
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }
      }
    };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, updateUser, user?.user_id]);

  const displayName = profile?.name ?? user?.name ?? "Người dùng";
  const displayAvatar = profile?.image_url ?? user?.image_url ?? "";

  const handleMenuClick = (item: MenuItem) => {
    if (item.destructive) {
      clearAuth();
      router.replace("/login");
      return;
    }

    router.push(item.href);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <div style={{ width: "24px" }} />
          <h1 style={styles.title}>Tài khoản</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          <section style={styles.hero}>
            <div style={styles.heroAvatar}>
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName} style={styles.heroAvatarImage} />
              ) : (
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.4">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            <p style={styles.heroText}>{displayName}</p>
          </section>

          {menuItems.map((item) => (
            <button
              key={item.title}
              type="button"
              style={{ ...styles.menuCard, ...(item.destructive ? styles.destructiveText : {}) }}
              onClick={() => handleMenuClick(item)}
            >
              <span>{item.title}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
