"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "../../../../frontend/dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ConfirmActionDialog from '../../../../frontend/shared/ConfirmActionDialog';
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../../../frontend/shared/screen.styles";

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
    padding: `20px ${SCREEN_CONTENT_PADDING_X} 120px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    borderRadius: "24px",
    border: "1px solid #E5E7EB",
    background: "linear-gradient(180deg, #fff 0%, #f8fafc 100%)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
  },
  badge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    borderRadius: "999px",
    background: "#FEF3C7",
    color: "#92400E",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  headline: {
    margin: 0,
    fontSize: "28px",
    lineHeight: "34px",
    fontWeight: 800,
    color: "#0F172A",
  },
  description: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: "22px",
  },
  userBox: {
    borderRadius: "18px",
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  userLabel: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#2563EB",
    fontWeight: 700,
  },
  userValue: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#0F172A",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#B91C1C",
    color: "#FFFFFF",
  },
  secondaryButton: {
    border: "1px solid #D1D5DB",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#FFFFFF",
    color: "#111827",
  },
  infoText: {
    margin: 0,
    fontSize: "13px",
    color: "#475569",
  },
  errorText: {
    margin: 0,
    fontSize: "13px",
    color: "#B91C1C",
  },
};

export default function LockAccountPage() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !user?.user_id) {
      router.replace("/login");
    }
  }, [initialized, isAuthenticated, router, user?.user_id]);

  const handleLogout = async () => {
    if (processing) {
      return;
    }

    setProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      clearAuth();
      await fetch("/api/auth/sync", { method: "DELETE" }).catch(() => undefined);
      router.replace("/login");
    }
  };

  const handleLockAndLogout = async () => {
    if (processing || !user?.user_id) {
      return;
    }
    setProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          status: "inactive",
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể khóa tài khoản.");
      }

      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      clearAuth();
      await fetch("/api/auth/sync", { method: "DELETE" }).catch(() => undefined);
      setMessage("Tài khoản đã được khóa và bạn đã được đăng xuất.");
      router.replace("/login");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể khóa tài khoản.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <button type="button" onClick={() => router.back()} style={styles.backLink} aria-label="Quay lại">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 style={styles.title}>Khóa tài khoản</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          <section style={styles.card}>
            <span style={styles.badge}>Cảnh báo</span>
            <h2 style={styles.headline}>Đưa tài khoản về trạng thái không hoạt động</h2>
            <p style={styles.description}>
              Khi khóa tài khoản, bạn sẽ bị đăng xuất ngay và lần đăng nhập sau sẽ cần mở khóa lại.
            </p>

            <div style={styles.userBox}>
              <p style={styles.userLabel}>Tài khoản hiện tại</p>
              <p style={styles.userValue}>{user?.name ?? "Người dùng"}</p>
              <p style={styles.infoText}>{user?.email ?? "Chưa có email"}</p>
              <p style={styles.infoText}>Trạng thái hiện tại: {user?.status ?? "không xác định"}</p>
            </div>

            {message ? <p style={styles.infoText}>{message}</p> : null}
            {error ? <p style={styles.errorText}>{error}</p> : null}

            <div style={styles.buttonRow}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => setConfirmOpen(true)}
                disabled={processing}
              >
                {processing ? "Đang xử lý..." : "Khóa tài khoản và đăng xuất"}
              </button>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => void handleLogout()}
                disabled={processing}
              >
                Chỉ đăng xuất
              </button>
            </div>
          </section>
        </main>

        <NavigationBar />

        <ConfirmActionDialog
          open={confirmOpen}
          title="Xác nhận khóa tài khoản"
          message="Bạn chắc chắn muốn khóa tài khoản này và đăng xuất ngay bây giờ? Hành động này sẽ đặt trạng thái tài khoản về 'inactive'."
          confirmLabel="Khóa và đăng xuất"
          confirmVariant="danger"
          loading={processing}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            await handleLockAndLogout();
          }}
        />
      </div>
    </div>
  );
}
