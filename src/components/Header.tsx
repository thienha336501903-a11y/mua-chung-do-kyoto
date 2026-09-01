import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-kyoto-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kyoto-800 to-kyoto-950 flex items-center justify-center text-champagne-300 shadow-md group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg text-kyoto-950 tracking-tight">
                CƯ DÂN KYOTO
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-champagne-100 text-champagne-800 border border-champagne-300">
                <Sparkles className="w-2.5 h-2.5" /> Mua Chung
              </span>
            </div>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              Khảo sát nhu cầu sắm đồ căn hộ mới
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href="#dang-ky"
            className="inline-flex items-center justify-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-kyoto-700 text-white hover:bg-kyoto-800 active:scale-95 shadow-sm transition-all"
          >
            ✍️ Đăng ký ngay
          </a>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg text-gray-600 hover:text-kyoto-800 hover:bg-kyoto-50 transition-colors"
            title="Dành cho Ban đại diện / Admin"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
