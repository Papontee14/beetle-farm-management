import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  title: "ฟาร์มด้วง | Beetle Farm Management",
  description: "ระบบจัดการฟาร์มด้วงครบวงจร",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="pb-24 md:pb-0">
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
