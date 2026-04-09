"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type ProfileResult = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  status: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    position: "relative",
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    fontFamily: "'Inter', sans-serif",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
  topNav: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "20px",
    color: "#1E1E1E",
    margin: 0,
  },
  backLink: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1E1E1E",
    textDecoration: "none",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: `20px ${SCREEN_CONTENT_PADDING_X} 120px`,
    gap: "clamp(16px, 4vw, 24px)",
  },
  profileHero: {
    width: "100%",
    borderRadius: "24px",
    background: "linear-gradient(160deg, #0f172a 0%, #115e59 60%, #10b981 100%)",
    color: "#FFFFFF",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  avatarSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  avatar: {
    width: "104px",
    height: "104px",
    background: "#F9FAFB",
    border: "2px solid #EFEFEF",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  infoCard: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoLabel: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6B7280",
  },
  infoValue: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  statGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  statCard: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statTitle: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  statValue: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A4331",
    wordBreak: "break-word",
  },
  infoText: {
    fontSize: "13px",
    color: "#6B7280",
    textAlign: "center",
    margin: 0,
    padding: "10px 0",
  },
  errorText: {
    fontSize: "13px",
    color: "#B91C1C",
    textAlign: "center",
    margin: 0,
    padding: "10px 0",
  },
  authCard: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "center",
  },
  authLink: {
    display: "inline-block",
    alignSelf: "center",
    padding: "10px 16px",
    borderRadius: "14px",
    background: "#51B788",
    color: "#FFFFFF",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  actionRow: {
    width: "100%",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  actionButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  actionPrimary: {
    background: "#51B788",
    color: "#FFFFFF",
  },
  actionSecondary: {
    background: "#F3F4F6",
    color: "#111827",
  },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function Profile() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const userId = user?.user_id;
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const hasLoadedProfileRef = useRef(false);

  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !userId) {
      router.replace("/login");
      return;
    }

    if (lastLoadedUserIdRef.current !== userId) {
      lastLoadedUserIdRef.current = userId;
      hasLoadedProfileRef.current = false;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      if (!hasLoadedProfileRef.current) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(`/api/account/profile?userId=${encodeURIComponent(userId)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as ProfileResult | { error?: string };

        if (!response.ok) {
          const message = typeof data === "object" && data && "error" in data ? String(data.error ?? "") : "";
          throw new Error(message || "Không thể tải hồ sơ.");
        }

        const nextProfile = data as ProfileResult;
        setProfile(nextProfile);
        hasLoadedProfileRef.current = true;
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setProfile(null);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải hồ sơ.");
        hasLoadedProfileRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, router, userId]);

  const displayName = profile?.name ?? user?.name ?? "Người dùng";
  const displayEmail = profile?.email ?? user?.email ?? "";
  const displayPhone = profile?.phone ?? "Chưa cập nhật";
  const displayAddress = profile?.address ?? "Chưa cập nhật";
  const displayStatus = profile?.status ?? user?.status ?? "unknown";
  const displayAvatar = profile?.image_url ?? user?.image_url ?? "";

  const profileFields = useMemo(
    () => [
      { label: "Mã người dùng", value: profile?.user_id ?? user?.user_id ?? "-" },
      { label: "Email", value: displayEmail || "-" },
      { label: "Số điện thoại", value: displayPhone },
      { label: "Địa chỉ", value: displayAddress },
      { label: "Trạng thái", value: displayStatus },
    ],
    [displayAddress, displayEmail, displayPhone, displayStatus, profile?.user_id, user?.user_id],
  );

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href="/dashboard" style={styles.backLink} aria-label="Quay lại dashboard">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.headerTitle}>Tài Khoản</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          {!initialized && <p style={styles.infoText}>Đang kiểm tra phiên đăng nhập...</p>}

          {initialized && !isAuthenticated && (
            <div style={styles.authCard}>
              <p style={styles.headerTitle}>Vui lòng đăng nhập</p>
              <p style={styles.infoText}>Tài khoản cá nhân sẽ được tải theo phiên đăng nhập hiện tại.</p>
              <Link href="/login" style={styles.authLink}>
                Đi tới đăng nhập
              </Link>
            </div>
          )}

          {initialized && isAuthenticated && (
            <>
              <section style={styles.profileHero}>
                <div style={styles.avatarSection}>
                  <div style={styles.avatar}>
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} style={styles.avatarImage} />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p style={styles.infoLabel}>Hồ sơ của</p>
                  <h2 style={{ margin: 0, fontSize: "24px", lineHeight: "30px", fontWeight: 800 }}>{displayName}</h2>
                  <p style={{ margin: 0, fontSize: "14px", color: "rgba(236, 253, 245, 0.9)" }}>{displayEmail}</p>
                </div>
              </section>

              {loading && <p style={styles.infoText}>Đang tải hồ sơ...</p>}
              {error && <p style={styles.errorText}>{error}</p>}

              {!loading && !error && profileFields.length > 0 && (
                <section style={styles.infoCard}>
                  <div style={styles.infoRow}>
                    <div>
                      <p style={styles.infoLabel}>Phiên hiện tại</p>
                      <p style={styles.infoValue}>{user?.user_id}</p>
                    </div>
                    <button type="button" style={{ ...styles.actionButton, ...styles.actionSecondary }} onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </div>

                  <div style={styles.statGrid}>
                    {profileFields.map((field) => (
                      <div key={field.label} style={styles.statCard}>
                        <p style={styles.statTitle}>{field.label}</p>
                        <p style={styles.statValue}>{field.value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={styles.actionRow}>
                    <button type="button" style={{ ...styles.actionButton, ...styles.actionPrimary }} onClick={() => router.push("/cart")}>
                      Xem giỏ hàng
                    </button>
                    <button type="button" style={{ ...styles.actionButton, ...styles.actionSecondary }} onClick={() => router.push("/dashboard")}>
                      Tiếp tục mua sắm
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
