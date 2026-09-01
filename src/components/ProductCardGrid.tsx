import React from 'react';
import { ProductDemandStat } from '@/types/demand';
import { formatNumber } from '@/lib/utils';
import { Flame, Users2, PackageCheck, Sparkles } from 'lucide-react';

interface ProductCardGridProps {
  products: ProductDemandStat[];
  totalHouseholds: number;
}

export default function ProductCardGrid({ products, totalHouseholds }: ProductCardGridProps) {
  if (totalHouseholds === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-kyoto-200 shadow-soft mb-12">
        <div className="w-16 h-16 rounded-2xl bg-kyoto-50 text-kyoto-700 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
          🏮
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-kyoto-950 mb-2">
          Chưa có nhu cầu nào được ghi nhận
        </h3>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto mb-6">
          Hãy là cư dân đầu tiên tham gia khảo sát để khởi đầu chương trình mua chung cùng toàn thể cộng đồng cư dân Kyoto ❤️
        </p>
        <a
          href="#dang-ky"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-kyoto-800 text-white font-bold text-sm hover:bg-kyoto-900 shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-champagne-300" />
          ĐĂNG KÝ NHU CẦU ĐẦU TIÊN
        </a>
      </div>
    );
  }

  return (
    <section id="tong-hop" className="mb-14 scroll-mt-20">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-kyoto-950 uppercase tracking-tight">
            Tổng Hợp Chi Tiết Từng Loại Sản Phẩm
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Dữ liệu thực tế tổng hợp từ <strong className="text-kyoto-900">{totalHouseholds}</strong> hộ cư dân Kyoto
          </p>
        </div>
      </div>

      {/* 9 Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {products.map((item) => {
          return (
            <div
              key={item.key}
              className={`relative bg-white rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${
                item.is_highest && item.total_qty > 0
                  ? 'border-amber-300 shadow-gold ring-2 ring-amber-400/30'
                  : 'border-kyoto-100 shadow-card hover:border-kyoto-300 hover:shadow-soft'
              }`}
            >
              {/* Highest Badge */}
              {item.is_highest && item.total_qty > 0 && (
                <div className="absolute -top-3 right-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  🔥 Nhu cầu cao nhất
                </div>
              )}

              {/* Card Header: Icon & Name */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-xl bg-kyoto-50 border border-kyoto-100 flex items-center justify-center text-2xl sm:text-3xl shadow-sm flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    {item.name}
                  </h3>
                  <span className="text-[11px] font-medium text-gray-500">
                    Đơn vị: {item.unit}
                  </span>
                </div>
              </div>

              {/* Key Number: Total Quantity */}
              <div className="bg-kyoto-50/60 rounded-xl p-3.5 mb-3 border border-kyoto-100/70">
                <div className="text-xs font-semibold text-gray-500 mb-0.5">
                  Tổng nhu cầu cộng đồng:
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-kyoto-950 tracking-tight">
                    {formatNumber(item.total_qty)}
                  </span>
                  <span className="text-sm font-semibold text-kyoto-700">
                    {item.unit}
                  </span>
                </div>
              </div>

              {/* Household Counter */}
              <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-kyoto-700" />
                  <span>Số hộ có nhu cầu:</span>
                </div>
                <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {formatNumber(item.households_count)} hộ
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
