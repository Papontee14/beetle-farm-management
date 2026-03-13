"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bug, Leaf } from "lucide-react";

const NAV = [
  { href: "/",        label: "หน้าหลัก",  icon: LayoutDashboard },
  { href: "/beetles", label: "ด้วง",      icon: Bug },
  { href: "/soil-alerts", label: "เปลี่ยนแมท", icon: Leaf },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-forest-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <span className="text-2xl">🪲</span>
          <h1 className="text-base font-bold tracking-tight flex-1">ระบบจัดการฟาร์มด้วง</h1>

          {/* Desktop nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Bottom navigation — mobile only */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
        <div className="max-w-lg mx-auto flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors
                  ${active ? "text-forest-700" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
