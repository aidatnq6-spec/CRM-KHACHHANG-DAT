import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CRM - Đạt · Quản lý & chăm sóc khách hàng",
  description: "Quản lý khách hàng, dịch vụ, chăm sóc và lịch hẹn.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#182d4e",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      {/* Browser extensions may add attributes such as cz-shortcut-listen before hydration. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
