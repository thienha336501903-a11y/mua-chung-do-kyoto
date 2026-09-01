import React from 'react';
import { ProductDemandStat } from '@/types/demand';

interface QuickTickerProps {
  products: ProductDemandStat[];
  totalHouseholds: number;
}

export default function QuickTicker({ products, totalHouseholds }: QuickTickerProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-kyoto-900 via-kyoto-800 to-kyoto-900 text-white border-b border-kyoto-700/50 py-2.5 px-3">
      <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex-shrink-0 flex items-center gap-1 bg-kyoto-950/70 border border-kyoto-600/50 px-2.5 py-1 rounded-md text-xs font-semibold text-champagne-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Thống kê nhanh:</span>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm whitespace-nowrap">
          {products.map((item, idx) => (
            <React.Fragment key={item.key}>
              <div className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-md transition-colors">
                <span>{item.icon}</span>
                <span className="font-medium text-gray-200">{item.name}</span>
                <span className="font-bold text-champagne-300">
                  {item.total_qty}
                </span>
                <span className="text-[11px] text-gray-400">({item.unit})</span>
              </div>
              {idx < products.length - 1 && (
                <span className="text-kyoto-400/60 select-none">•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
