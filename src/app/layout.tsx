import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import PWARegister from "@/components/PWARegister";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  title: "ฟาร์มด้วง | Beetle Farm Management",
  description: "ระบบจัดการฟาร์มด้วงครบวงจร",
  manifest: "/manifest.webmanifest",
  applicationName: "ฟาร์มด้วง",
  icons: {
    icon: [
      { url: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ฟาร์มด้วง",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4b6b4f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="pb-24 md:pb-0">
        <PWARegister />
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6">{children}</main>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: "var(--font-noto-sans-thai), Noto Sans Thai, sans-serif", fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
