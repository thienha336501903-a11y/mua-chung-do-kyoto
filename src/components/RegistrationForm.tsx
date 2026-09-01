'use client';

import React, { useState } from 'react';
import { PRODUCTS } from '@/lib/constants';
import { ProductKey, SubmitDemandPayload } from '@/types/demand';
import { isValidVietnamesePhone, normalizePhoneNumber } from '@/lib/utils';
import {
  Shield,
  Send,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

interface RegistrationFormProps {
  onSuccess: (submittedData: {
    zalo_name: string;
    apartment_number: string;
    phone_number: string;
    items: { key: ProductKey; name: string; icon: string; quantity: number; unit: string }[];
    isUpdate: boolean;
  }) => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [zaloName, setZaloName] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [note, setNote] = useState('');
  const [selectedDemands, setSelectedDemands] = useState<
    Record<ProductKey, { selected: boolean; quantity: number }>
  >({
    tv: { selected: false, quantity: 1 },
    sofa: { selected: false, quantity: 1 },
    curtain: { selected: false, quantity: 1 },
    drying_rack: { selected: false, quantity: 1 },
    bed: { selected: false, quantity: 1 },
    dining_table_set: { selected: false, quantity: 1 },
    refrigerator: { selected: false, quantity: 1 },
    washing_machine: { selected: false, quantity: 1 },
    dryer: { selected: false, quantity: 1 },
    dishwasher: { selected: false, quantity: 1 },
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toggle selection
  const handleToggle = (key: ProductKey) => {
    setSelectedDemands((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: {
          selected: !current.selected,
          quantity: current.quantity > 0 ? current.quantity : 1,
        },
      };
    });
    setErrorMsg(null);
  };

  // Change quantity
  const handleQuantityChange = (key: ProductKey, delta: number) => {
    setSelectedDemands((prev) => {
      const current = prev[key];
      const newQty = Math.min(Math.max(current.quantity + delta, 1), 10);
      return {
        ...prev,
        [key]: {
          selected: true,
          quantity: newQty,
        },
      };
    });
  };

  // Check how many items selected
  const activeCount = Object.values(selectedDemands).filter((v) => v.selected).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const trimmedZalo = zaloName.trim();
    const trimmedApt = apartmentNumber.trim().toUpperCase();
    const rawPhone = phoneNumber.trim();
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const isTestPhone = rawPhone.includes('__TEST_');

    if (!trimmedZalo) {
      setErrorMsg('Vui lòng nhập Tên Zalo của bạn');
      return;
    }

    if (!trimmedApt) {
      setErrorMsg('Vui lòng nhập Số căn hộ (Ví dụ: K5-1208)');
      return;
    }

    if (!rawPhone || (!isTestPhone && !isValidVietnamesePhone(normalizedPhone))) {
      setErrorMsg('Vui lòng nhập số điện thoại hợp lệ (Ví dụ: 0912 345 678)');
      return;
    }

    if (activeCount === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm bạn đang có nhu cầu mua');
      return;
    }

    setLoading(true);

    try {
      const payload: SubmitDemandPayload = {
        zalo_name: trimmedZalo,
        apartment_number: trimmedApt,
        phone_number: isTestPhone ? rawPhone : normalizedPhone,
        tv_qty: selectedDemands.tv.selected ? selectedDemands.tv.quantity : 0,
        sofa_qty: selectedDemands.sofa.selected ? selectedDemands.sofa.quantity : 0,
        curtain_qty: selectedDemands.curtain.selected ? selectedDemands.curtain.quantity : 0,
        drying_rack_qty: selectedDemands.drying_rack.selected ? selectedDemands.drying_rack.quantity : 0,
        bed_qty: selectedDemands.bed.selected ? selectedDemands.bed.quantity : 0,
        dining_table_set_qty: selectedDemands.dining_table_set.selected ? selectedDemands.dining_table_set.quantity : 0,
        refrigerator_qty: selectedDemands.refrigerator.selected ? selectedDemands.refrigerator.quantity : 0,
        washing_machine_qty: selectedDemands.washing_machine.selected ? selectedDemands.washing_machine.quantity : 0,
        dryer_qty: selectedDemands.dryer.selected ? selectedDemands.dryer.quantity : 0,
        dishwasher_qty: selectedDemands.dishwasher.selected ? selectedDemands.dishwasher.quantity : 0,
        note: note.trim() || undefined,
      };

      const res = await fetch('/api/demands/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi gửi thông tin');
      }

      // Prepare summary of submitted items for Success Modal
      const submittedItems = PRODUCTS.filter(
        (p) => selectedDemands[p.key].selected && selectedDemands[p.key].quantity > 0
      ).map((p) => ({
        key: p.key,
        name: p.name,
        icon: p.icon,
        quantity: selectedDemands[p.key].quantity,
        unit: p.unit,
      }));

      onSuccess({
        zalo_name: trimmedZalo,
        apartment_number: trimmedApt,
        phone_number: isTestPhone ? rawPhone : normalizedPhone,
        items: submittedItems,
        isUpdate: !!json.isUpdate,
      });

    } catch (err: any) {
      console.error('[Form Submit Error]', err);
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="dang-ky" className="scroll-mt-16 mb-16">
      <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-10 shadow-card border border-kyoto-100 relative">
        {/* Form Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne-100 text-champagne-900 border border-champagne-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-champagne-700" />
            KHẢO SÁT NHU CẦU MUA CHUNG
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-kyoto-950 uppercase tracking-tight">
            Đăng Ký Nhu Cầu Của Bạn
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
            Điền nhanh trong 30 giây — Chọn các món đồ bạn dự định sắm cho căn hộ mới
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Resident Info (3 Columns on Desktop, 1 Column on Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 bg-kyoto-50/50 p-4 sm:p-6 rounded-2xl border border-kyoto-100">
            {/* 1. Zalo Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Tên Zalo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={zaloName}
                onChange={(e) => setZaloName(e.target.value)}
                placeholder="Nhập tên Zalo của bạn"
                required
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kyoto-700 focus:border-transparent text-sm sm:text-base transition-all font-medium shadow-sm"
              />
              <p className="text-[11px] text-gray-500 mt-1.5">
                Tên hiển thị trên nhóm Zalo cư dân
              </p>
            </div>

            {/* 2. Apartment Number */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Số căn hộ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
                placeholder="Ví dụ: K5-1208"
                required
                maxLength={30}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kyoto-700 focus:border-transparent text-sm sm:text-base uppercase tracking-wider transition-all font-bold shadow-sm"
              />
              {/* Privacy Badge for Apartment */}
              <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold mt-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80">
                <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>Bảo mật tuyệt đối – Số căn KHÔNG hiển thị công khai</span>
              </div>
            </div>

            {/* 3. Phone Number */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912 345 678"
                required
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kyoto-700 focus:border-transparent text-sm sm:text-base tracking-wide transition-all font-bold shadow-sm"
              />
              {/* Privacy Badge for Phone */}
              <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold mt-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80">
                <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>🔒 Bảo mật tuyệt đối – Chỉ Admin mới nhìn thấy số điện thoại</span>
              </div>
            </div>
          </div>

          {/* Section 2: 10 Product Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-kyoto-950 flex items-center gap-2">
                  <span>Danh Sách Sản Phẩm Cần Khảo Sát</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-kyoto-100 text-kyoto-800 font-bold">
                    Đã chọn: {activeCount}/{PRODUCTS.length}
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Tích chọn những sản phẩm bạn có nhu cầu và điều chỉnh số lượng mong muốn
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {PRODUCTS.map((p) => {
                const state = selectedDemands[p.key];

                return (
                  <div
                    key={p.key}
                    onClick={() => !state.selected && handleToggle(p.key)}
                    className={`relative rounded-2xl p-4 sm:p-5 transition-all cursor-pointer border ${
                      state.selected
                        ? 'bg-kyoto-50/40 border-kyoto-600 shadow-soft ring-1 ring-kyoto-600/30'
                        : 'bg-white border-gray-200 hover:border-kyoto-300 hover:bg-gray-50/50'
                    }`}
                  >
                    {/* Top Row: Icon, Name & Toggle Button */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl sm:text-3xl select-none">{p.icon}</span>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base leading-tight">
                            {p.name}
                          </h4>
                          <span className="text-[11px] text-gray-500">
                            Đơn vị: {p.unit}
                          </span>
                        </div>
                      </div>

                      {/* Checkbox Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(p.key);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 flex-shrink-0 ${
                          state.selected
                            ? 'bg-kyoto-700 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-kyoto-100 hover:text-kyoto-900 border border-gray-200'
                        }`}
                      >
                        {state.selected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Có nhu cầu</span>
                          </>
                        ) : (
                          <>
                            <span className="w-3 h-3 rounded-sm border border-gray-400 inline-block" />
                            <span>Có nhu cầu</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quantity Stepper (Only visible when checked) */}
                    {state.selected && (
                      <div
                        className="mt-3 pt-3 border-t border-kyoto-200/70 flex items-center justify-between animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs font-semibold text-kyoto-900">
                          Số lượng:
                        </span>

                        <div className="flex items-center gap-2 bg-white rounded-xl border border-kyoto-300 px-2 py-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p.key, -1)}
                            disabled={state.quantity <= 1}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-kyoto-100 text-gray-700 flex items-center justify-center active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-8 text-center font-black text-base text-kyoto-950">
                            {state.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p.key, 1)}
                            disabled={state.quantity >= 10}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-kyoto-100 text-gray-700 flex items-center justify-center active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Optional Note */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Ghi chú thêm cho Ban đại diện (Không bắt buộc)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Mong muốn Tivi 65 inch, Tủ lạnh 4 cánh, Bàn ăn 6 ghế mặt đá..."
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kyoto-600 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-kyoto-700 via-kyoto-800 to-kyoto-900 hover:from-kyoto-800 hover:to-kyoto-950 text-white font-extrabold text-base sm:text-lg shadow-gold active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi khảo sát...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-champagne-300" />
                  <span>GỬI NHU CẦU CỦA TÔI</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-gray-500 mt-2.5">
              💡 Bạn có thể gửi lại bất cứ lúc nào với cùng Số căn hộ để cập nhật nhu cầu mới.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
