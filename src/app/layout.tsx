import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ฟาร์มด้วง | Beetle Farm Management",
  description: "ระบบจัดการฟาร์มด้วงครบวงจร",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="pb-24">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 pt-4">{children}</main>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: "Noto Sans Thai, sans-serif", fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
