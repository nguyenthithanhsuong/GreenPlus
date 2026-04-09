"use client";

import Link from "next/link";
import NavigationBar from "../../dashboard/components/NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type ProfileSubPageProps = {
  title: string;
  description: string;
};

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
  card: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  desc: {
    margin: 0,
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: "20px",
  },
};

export default function ProfileSubPage({ title, description }: ProfileSubPageProps) {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link href="/profile" style={styles.backLink} aria-label="Quay lại profile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 style={styles.title}>{title}</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.main}>
          <section style={styles.card}>
            <p style={styles.desc}>{description}</p>
          </section>
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
