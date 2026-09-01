import React from 'react';
import { ProductDemandStat } from '@/types/demand';
import { formatNumber } from '@/lib/utils';
import { BarChart3, Flame } from 'lucide-react';

interface DemandBarChartProps {
  products: ProductDemandStat[];
  highestQty: number;
}

export default function DemandBarChart({ products, highestQty }: DemandBarChartProps) {
  const maxVal = Math.max(highestQty, 1);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-card border border-kyoto-100 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-kyoto-50 border border-kyoto-200 flex items-center justify-center text-kyoto-800">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-kyoto-950 uppercase tracking-tight">
              Biểu Đồ Nhu Cầu Hiện Tại Của Cộng Đồng
            </h2>
            <p className="text-xs text-gray-500">
              So sánh tổng số lượng sản phẩm cư dân đang cần sắm
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-kyoto-50 text-kyoto-800 border border-kyoto-200 self-start sm:self-auto">
          Cập nhật thời gian thực
        </span>
      </div>

      <div className="space-y-4">
        {products.map((item) => {
          const percent = maxVal > 0 ? Math.min(Math.round((item.total_qty / maxVal) * 100), 100) : 0;
          const displayPercent = Math.max(percent, item.total_qty > 0 ? 6 : 0);

          return (
            <div key={item.key} className="group">
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg">{item.icon}</span>
                  <span className="font-semibold text-gray-900 group-hover:text-kyoto-800 transition-colors">
                    {item.name}
                  </span>
                  {item.is_highest && item.total_qty > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                      Cao nhất
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] sm:text-xs text-gray-500">
                    <strong className="text-gray-700">{item.households_count}</strong> hộ cần
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-kyoto-900 min-w-[60px] text-right">
                    {formatNumber(item.total_qty)}{' '}
                    <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                  </span>
                </div>
              </div>

              {/* Bar track & fill */}
              <div className="h-4 sm:h-5 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2 ${
                    item.is_highest && item.total_qty > 0
                      ? 'bg-gradient-to-r from-amber-500 via-champagne-500 to-amber-600 shadow-sm'
                      : 'bg-gradient-to-r from-kyoto-600 via-kyoto-700 to-kyoto-800'
                  }`}
                  style={{ width: `${displayPercent}%` }}
                >
                  {item.total_qty > 0 && percent >= 20 && (
                    <span className="text-[10px] font-bold text-white leading-none">
                      {item.total_qty}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
