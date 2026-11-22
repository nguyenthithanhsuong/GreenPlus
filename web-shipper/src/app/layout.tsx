import PwaRegister from "./PwaRegister";
import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "../../../packages/support-ui/theme.css";
import ThemePreferences from "../../../packages/support-ui/ThemePreferences";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  applicationName: "GreenPlus Shipper",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GreenPlus Shipper",
  },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  title: "GreenPlus - Web Shipper",
  description: "Shipper mobile dashboard for GreenPlus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <PwaRegister />
        {children}
        <ThemePreferences />
      </body>
    </html>
  );
}
