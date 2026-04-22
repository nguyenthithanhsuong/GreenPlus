import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
      <body>{children}</body>
    </html>
  );
}
