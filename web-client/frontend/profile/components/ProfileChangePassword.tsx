"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavigationBar from "../../dashboard/components/NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

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
  main: {
    flex: 1,
    padding: `16px ${SCREEN_CONTENT_PADDING_X} 120px`,
  },
};

export default function ProfileChangePassword() {
  // User ID State
  const [userIdInput, setUserIdInput] = useState("");
  const [activeUserId, setActiveUserId] = useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Request Handling State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ updated?: boolean; error?: string } | null>(null);

  // Initialize User ID from Local Storage
  useEffect(() => {
    const savedUserId = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    setActiveUserId(savedUserId);
    setUserIdInput(savedUserId);
  }, []);

  // Resolve User ID Logic
  const resolveUserId = (): string => {
    const normalized = userIdInput.trim() || activeUserId.trim();
    if (!normalized) {
      throw new Error("Please sign in first or provide userId");
    }
    return normalized;
  };

  const changePassword = async () => {
    // Basic pre-validation
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // This will throw an error and jump to catch if no user ID is found
      const userId = resolveUserId(); 
      
      const response = await fetch("/api/account/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as { updated?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Change password failed");
      }

      setResult(data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* Header */}
        <header style={styles.topNav}>
          <Link href="/profile" style={styles.backLink} aria-label="Back to profile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.title}>Change Password</h1>
          <div style={{ width: "24px" }} /> {/* Empty div to keep title centered */}
        </header>

        {/* Main Content */}
        <main style={styles.main}>
          <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm text-gray-600">
              Update your password to keep your account secure.
            </p>

            {/* Inputs */}
            <div className="flex w-full flex-col gap-4">
              {/* Optional: User ID field visible for testing purposes */}
              <div className="flex w-full flex-col gap-4">
  <input
    value={currentPassword}
    onChange={(event) => setCurrentPassword(event.target.value)}
    placeholder="Current password"
    type="password"
    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
  />

  <input
    value={newPassword}
    onChange={(event) => setNewPassword(event.target.value)}
    placeholder="New password"
    type="password"
    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
  />

  <input
    value={confirmPassword}
    onChange={(event) => setConfirmPassword(event.target.value)}
    placeholder="Retype new password"
    type="password"
    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
  />
</div>
            </div>

            {/* Status Messages */}
            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
            {result?.updated && (
              <p className="mt-3 text-sm font-medium text-green-600">Password changed successfully!</p>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => void changePassword()}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="rounded bg-rose-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-800 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Change Password"}
              </button>
            </div>
          </section>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}