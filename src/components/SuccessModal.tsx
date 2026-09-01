'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, CheckCircle2, ArrowUpCircle, Sparkles } from 'lucide-react';
import { ProductKey } from '@/types/demand';

interface SubmittedItem {
  key: ProductKey;
  name: string;
  icon: string;
  quantity: number;
  unit: string;
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    zalo_name: string;
    apartment_number: string;
    items: SubmittedItem[];
    isUpdate: boolean;
  } | null;
}

export default function SuccessModal({ isOpen, onClose, data }: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire festive confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0c3b2e', '#d4a350', '#10b981', '#fbbf24'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-champagne-300 relative text-center animate-scaleUp">
        {/* Heart Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/30">
          <Heart className="w-8 h-8 fill-white animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-kyoto-950 uppercase tracking-tight mb-1">
          ĐÃ GHI NHẬN NHU CẦU ❤️
        </h2>

        <p className="text-xs sm:text-sm text-gray-600 mb-6">
          {data.isUpdate
            ? 'Nhu cầu của căn hộ bạn đã được cập nhật thành công trên hệ thống.'
            : 'Khảo sát của bạn đã được ghi nhận vào tổng nhu cầu của cộng đồng Kyoto.'}
        </p>

        {/* Summary of User's Selected Items */}
        <div className="bg-kyoto-50/70 rounded-2xl p-4 mb-6 border border-kyoto-100 text-left">
          <div className="text-xs font-bold text-kyoto-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Nhu cầu của bạn ({data.zalo_name}):
          </div>

          <div className="space-y-2">
            {data.items.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="font-semibold text-gray-800">{item.name}</span>
                </div>
                <span className="font-black text-kyoto-900 bg-champagne-50 px-2 py-0.5 rounded border border-champagne-200">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Thank You Note */}
        <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed mb-6">
          Cảm ơn bạn đã tham gia khảo sát nhu cầu mua sắm cùng cộng đồng cư dân Kyoto.
        </p>

        {/* Action Button: XEM NHU CẦU TOÀN CỘNG ĐỒNG */}
        <button
          type="button"
          onClick={() => {
            onClose();
            const el = document.getElementById('tong-hop');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-kyoto-800 to-kyoto-950 text-white font-extrabold text-sm sm:text-base hover:from-kyoto-900 hover:to-black shadow-card active:scale-95 flex items-center justify-center gap-2 transition-all"
        >
          <ArrowUpCircle className="w-5 h-5 text-champagne-300" />
          XEM NHU CẦU TOÀN CỘNG ĐỒNG
        </button>
      </div>
    </div>
  );
}
