import PwaRegister from "./PwaRegister";
import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "GreenPlus Shipper",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "GreenPlus Shipper" },
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
      <body><PwaRegister />{children}</body>
    </html>
  );
}
