import React from 'react';
import Link from 'next/link';
import { Building, ArrowLeft, DollarSign, Sparkles } from 'lucide-react';

export default function SupplierHeader() {
  return (
    <header className="bg-gradient-to-r from-kyoto-950 via-kyoto-900 to-kyoto-950 text-white border-b border-kyoto-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-champagne-500/20 border border-champagne-400/40 flex items-center justify-center text-champagne-300 shadow-sm group-hover:scale-105 transition-transform">
            <DollarSign className="w-6 h-6 text-champagne-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-champagne-300 transition-colors">
                CƯ DÂN KYOTO
              </span>
              <span className="text-[10px] bg-champagne-400/20 text-champagne-300 px-2 py-0.5 rounded-full border border-champagne-400/40 font-bold uppercase tracking-wider">
                Chào Giá Đại Lý
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Cổng tiếp nhận báo giá từ Nhà Phân Phối / Đại Lý
            </p>
          </div>
        </Link>

        {/* Back Link to Public Resident Survey */}
        <Link
          href="/"
          className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-all flex items-center gap-1.5 border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-champagne-300" />
          <span>Về trang khảo sát cư dân</span>
        </Link>
      </div>
    </header>
  );
}
