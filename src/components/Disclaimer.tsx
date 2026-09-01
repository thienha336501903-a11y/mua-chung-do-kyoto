import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="bg-amber-50/80 rounded-2xl p-4 sm:p-5 border border-amber-200/90 mb-12">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 flex-shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-tight mb-1">
            Lưu Ý Quan Trọng
          </h4>
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
            Đây là khảo sát nhu cầu tự nguyện của cộng đồng cư dân, không phải đơn đặt hàng và không tạo nghĩa vụ mua hàng.
          </p>
        </div>
      </div>
    </div>
  );
}
