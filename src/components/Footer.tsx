import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-kyoto-950 text-gray-400 border-t border-kyoto-800 pt-10 pb-8 text-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-kyoto-800/80 pb-6 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-kyoto-900 border border-kyoto-700 flex items-center justify-center text-champagne-300">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">
              CỘNG ĐỒNG CƯ DÂN KYOTO
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a href="#dang-ky" className="hover:text-champagne-300 transition-colors">
              Đăng ký nhu cầu
            </a>
            <span>•</span>
            <a href="#tong-hop" className="hover:text-champagne-300 transition-colors">
              Tổng hợp số lượng
            </a>
            <span>•</span>
            <Link href="/admin" className="hover:text-champagne-300 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Quản trị
            </Link>
          </div>
        </div>

        {/* Footer Mandatory Disclaimer */}
        <div className="text-center sm:text-left text-[11px] leading-relaxed text-gray-400 max-w-3xl">
          <p className="mb-2">
            Website cộng đồng do cư dân tự tạo lập nhằm tổng hợp nhu cầu mua sắm và hỗ trợ cư dân làm việc với các nhà cung cấp. Không phải website chính thức của Chủ đầu tư.
          </p>
          <p className="text-gray-500">
            © {new Date().getFullYear()} Nhu Cầu Mua Sắm Cư Dân Kyoto. Vì một cộng đồng văn minh & gắn kết.
          </p>
        </div>
      </div>
    </footer>
  );
}
