import React from 'react';
import Link from 'next/link';
import { Users, ArrowDownCircle, Sparkles, Building, TrendingUp, DollarSign } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface HeroSectionProps {
  totalHouseholds: number;
  highestProducts: string[];
  highestQty: number;
}

export default function HeroSection({
  totalHouseholds,
  highestProducts,
  highestQty,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-kyoto-50 via-white to-gray-50 pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-kyoto-100">
      {/* Decorative Kyoto Pattern subtle backdrop */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0c3b2e_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Community Badge with direct Zalo Group Link and subtle pulse animation */}
        <a
          href="https://zalo.me/g/qwxsrujqpijko8xmi0uk"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Truy cập Cộng Đồng Cư Dân Chung Cư Kyoto trên Zalo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-kyoto-100 text-kyoto-900 border border-kyoto-200 text-xs sm:text-sm font-semibold mb-4 shadow-sm hover:bg-kyoto-200/90 hover:border-kyoto-300 hover:text-kyoto-950 active:scale-[0.98] transition-all duration-200 animate-pulse-subtle max-w-full text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-kyoto-600 focus:ring-offset-2"
        >
          <Building className="w-4 h-4 text-kyoto-700 flex-shrink-0" />
          <span className="leading-snug">Ấn để truy cập Cộng Đồng Cư Dân Chung Cư Kyoto</span>
        </a>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-kyoto-950 tracking-tight leading-tight uppercase mb-3">
          Nhu Cầu Mua Sắm Cư Dân Kyoto
        </h1>

        {/* Short Description */}
        <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
          Cùng tổng hợp nhu cầu để cộng đồng có cơ sở làm việc với các nhà phân phối,
          đại lý điện máy & nội thất nhằm đàm phán mức giá mua chung tốt nhất cho cư dân.
        </p>

        {/* Key Real-Time Stat Badge: 👥 X hộ đã tham gia */}
        <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 bg-gradient-to-br from-kyoto-900 to-kyoto-950 text-white px-6 py-4 rounded-2xl shadow-card border border-champagne-400/30 mb-8 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-champagne-500/20 border border-champagne-400/30 flex items-center justify-center text-champagne-300">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-300 font-medium">Toàn bộ cộng đồng</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-champagne-200 tracking-tight">
                👥 {formatNumber(totalHouseholds)} hộ
              </div>
            </div>
          </div>

          {highestQty > 0 && highestProducts.length > 0 && (
            <div className="hidden sm:block border-l border-kyoto-700 h-10" />
          )}

          {highestQty > 0 && highestProducts.length > 0 && (
            <div className="text-left text-xs sm:text-sm">
              <div className="text-champagne-300 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Nhu cầu hot nhất:
              </div>
              <div className="text-white font-medium">
                {highestProducts.join(', ')} ({formatNumber(highestQty)})
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons in Vertical Stack */}
        <div className="flex flex-col items-center justify-center gap-3 max-w-lg mx-auto">
          {/* 1. Primary CTA for Residents */}
          <a
            href="#dang-ky"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold rounded-2xl bg-gradient-to-r from-kyoto-700 via-kyoto-800 to-kyoto-900 text-white hover:from-kyoto-800 hover:to-kyoto-950 shadow-soft active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-5 h-5 text-champagne-300" />
            <span>✨ ĐĂNG KÝ NHU CẦU CỦA TÔI</span>
          </a>

          {/* 2. Gold CTA for Suppliers */}
          <div className="w-full">
            <Link
              href="/nha-cung-cap"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-extrabold rounded-2xl bg-gradient-to-r from-champagne-400 via-amber-400 to-champagne-500 hover:from-champagne-300 hover:to-amber-300 text-kyoto-950 border border-champagne-300 shadow-md active:scale-[0.98] transition-all"
            >
              <DollarSign className="w-4 h-4 stroke-[3]" />
              <span>💰 NHÀ PHÂN PHỐI ĐĂNG KÝ CHÀO GIÁ TỐT</span>
            </Link>
            <p className="text-[11px] text-gray-500 mt-1">
              Dành cho đại lý / nhà phân phối gửi báo giá tốt cho các model cư dân đang quan tâm.
            </p>
          </div>

          {/* 3. Community Demand CTA */}
          <a
            href="#tong-hop"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-white text-kyoto-900 border border-kyoto-200 hover:bg-kyoto-50 shadow-sm active:scale-[0.98] transition-all"
          >
            <ArrowDownCircle className="w-4 h-4 text-kyoto-700" />
            <span>↓ Xem Nhu Cầu Toàn Cộng Đồng</span>
          </a>
        </div>
      </div>
    </section>
  );
}
