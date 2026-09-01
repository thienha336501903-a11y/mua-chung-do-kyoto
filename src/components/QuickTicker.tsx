'use client';

import React, { useState, useRef } from 'react';
import { ProductDemandStat } from '@/types/demand';
import { generateZaloShareText } from '@/lib/share';
import { Copy, Check, Sparkles, X, Share2 } from 'lucide-react';

interface QuickTickerProps {
  products: ProductDemandStat[];
  totalHouseholds: number;
  highestProducts?: string[];
  highestQty?: number;
}

export default function QuickTicker({
  products,
  totalHouseholds,
}: QuickTickerProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!products || products.length === 0) return null;

  const handleCopy = async () => {
    const textToCopy = generateZaloShareText(products, totalHouseholds);

    let success = false;

    // 1. Thử dùng navigator.clipboard.writeText
    if (navigator?.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } catch (err) {
        console.warn('navigator.clipboard failed, attempting fallback...', err);
      }
    }

    // 2. Fallback bằng document.execCommand('copy') nếu Clipboard API bị chặn trên Zalo WebView
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        // Đặt ở vị trí khuất nhưng vẫn thuộc DOM
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const execSuccess = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (execSuccess) {
          success = true;
        }
      } catch (err) {
        console.warn('execCommand failed, opening modal fallback...', err);
      }
    }

    if (success) {
      setCopied(true);
      setShowToast(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2800);
    } else {
      // 3. Nếu cả 2 cách trên đều bị chặn (ví dụ iframe sandbox cực kỳ nghiêm ngặt), mở Modal
      setModalText(textToCopy);
      setShowFallbackModal(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-kyoto-900 via-kyoto-800 to-kyoto-900 text-white border-b border-kyoto-700/50 py-2 px-3 relative z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {/* NÚT COPY THỐNG KÊ NHANH */}
          <button
            type="button"
            onClick={handleCopy}
            title="Bấm để copy nhanh số liệu gửi vào nhóm Zalo cư dân"
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm border ${
              copied
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                : 'bg-gradient-to-r from-kyoto-950 to-kyoto-900 hover:from-kyoto-900 hover:to-kyoto-800 text-champagne-300 border-champagne-400/40 hover:border-champagne-300'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[3] animate-scaleUp" />
                <span className="font-extrabold text-white">
                  ✅ Đã copy thống kê
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-champagne-300" />
                <span>📋 Copy thống kê nhanh</span>
              </>
            )}
          </button>

          {/* Các chip sản phẩm ngang */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm whitespace-nowrap pl-1">
            {products.map((item, idx) => (
              <React.Fragment key={item.key}>
                <div className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-md transition-colors">
                  <span>{item.icon}</span>
                  <span className="font-medium text-gray-200">{item.shortName || item.name}</span>
                  <span className="font-bold text-champagne-300">
                    {item.total_qty}
                  </span>
                  <span className="text-[11px] text-gray-400">({item.unit})</span>
                </div>
                {idx < products.length - 1 && (
                  <span className="text-kyoto-400/50 select-none">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-kyoto-950 text-white border border-champagne-400/50 shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-fadeIn max-w-[90vw] text-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>✅ Đã copy thống kê mới nhất. Bạn có thể dán ngay vào nhóm Zalo ❤️</span>
        </div>
      )}

      {/* Fallback Modal nếu Clipboard API bị WebView chặn */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-kyoto-200 relative text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <h3 className="font-bold text-base text-kyoto-950 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-kyoto-800" />
                <span>Nội dung gửi vào Zalo</span>
              </h3>
              <button
                onClick={() => setShowFallbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-2">
              Bạn có thể sao chép đoạn nội dung bên dưới và dán vào nhóm Zalo cư dân:
            </p>

            <textarea
              readOnly
              value={modalText}
              rows={12}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-kyoto-600 resize-none mb-4"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const el = document.querySelector('textarea');
                    if (el) {
                      el.select();
                      document.execCommand('copy');
                    }
                  } catch {}
                  setShowFallbackModal(false);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2800);
                }}
                className="px-5 py-2.5 rounded-xl bg-kyoto-800 hover:bg-kyoto-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Copy className="w-3.5 h-3.5 text-champagne-300" />
                <span>CHỌN TẤT CẢ & SAO CHÉP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
