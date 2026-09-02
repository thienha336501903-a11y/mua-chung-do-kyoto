'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PRODUCTS, COMMON_BRANDS } from '@/lib/constants';
import { ProductKey } from '@/types/demand';
import { SupplierTenderItem } from '@/types/supplier';
import { Plus, Sparkles, ChevronDown, ChevronUp, AlertCircle, Copy } from 'lucide-react';

interface QuickModelEntryBoxProps {
  tenderId: string;
  communityDemandMap: Record<ProductKey, number>;
  existingItems: SupplierTenderItem[];
  onItemAdded: (item: SupplierTenderItem) => void;
  clonedItem?: Partial<SupplierTenderItem> | null;
  onClearCloned?: () => void;
}

export default function QuickModelEntryBox({
  tenderId,
  communityDemandMap,
  existingItems,
  onItemAdded,
  clonedItem,
  onClearCloned,
}: QuickModelEntryBoxProps) {
  const [categoryKey, setCategoryKey] = useState<ProductKey>('refrigerator');
  const [brand, setBrand] = useState('Panasonic');
  const [modelCode, setModelCode] = useState('');
  const [referenceQty, setReferenceQty] = useState(1);
  const [productName, setProductName] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const modelInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill quantity from community demand when category changes
  const communityQty = communityDemandMap[categoryKey] || 0;
  const currentProduct = PRODUCTS.find((p) => p.key === categoryKey);

  const handleApplyCommunityQty = () => {
    if (communityQty > 0) {
      setReferenceQty(communityQty);
    }
  };

  // Check duplicate on model input
  useEffect(() => {
    const trimmedModel = modelCode.trim().toUpperCase();
    const trimmedBrand = brand.trim().toUpperCase();
    if (trimmedModel && trimmedBrand) {
      const isDup = existingItems.some(
        (it) =>
          it.category_key === categoryKey &&
          it.brand.trim().toUpperCase() === trimmedBrand &&
          it.model_code.trim().toUpperCase() === trimmedModel
      );
      if (isDup) {
        setDuplicateWarning(`Model ${brand} ${modelCode} đã có trong danh sách đợt này!`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [categoryKey, brand, modelCode, existingItems]);

  // Handle clone item payload if supplied
  useEffect(() => {
    if (clonedItem) {
      if (clonedItem.category_key) setCategoryKey(clonedItem.category_key);
      if (clonedItem.brand) setBrand(clonedItem.brand);
      if (clonedItem.model_code) setModelCode(clonedItem.model_code);
      if (clonedItem.reference_qty) setReferenceQty(clonedItem.reference_qty);
      if (clonedItem.product_name) setProductName(clonedItem.product_name);
      if (clonedItem.specifications) setSpecifications(clonedItem.specifications);
      modelInputRef.current?.focus();
      if (onClearCloned) onClearCloned();
    }
  }, [clonedItem, onClearCloned]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedBrand = brand.trim();
    const trimmedModel = modelCode.trim().toUpperCase();

    if (!trimmedBrand) {
      setErrorMsg('Vui lòng chọn hoặc nhập Thương hiệu');
      return;
    }

    if (!trimmedModel) {
      setErrorMsg('Vui lòng nhập Mã Model');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/tenders/${tenderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_key: categoryKey,
          brand: trimmedBrand,
          model_code: trimmedModel,
          reference_qty: referenceQty > 0 ? referenceQty : 1,
          product_name: productName.trim() || undefined,
          specifications: specifications.trim() || undefined,
          display_order: existingItems.length + 1,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi thêm model');
      }

      onItemAdded(json.data);

      // Reset for consecutive fast addition:
      // Keep categoryKey and brand, clear modelCode and extra details, focus back to modelCode
      setModelCode('');
      setProductName('');
      setSpecifications('');
      modelInputRef.current?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-kyoto-900 to-kyoto-950 text-white rounded-2xl p-4 sm:p-6 shadow-card border border-champagne-400/30 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-kyoto-800 pb-3 mb-4">
        <div>
          <h3 className="font-black text-base sm:text-lg text-champagne-200 uppercase tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-champagne-400" />
            <span>Thêm Nhanh Model Mời Chào Giá</span>
          </h3>
          <p className="text-xs text-gray-300">
            Thêm liên tiếp các model cần đại lý báo giá — Tự động điền số lượng nhu cầu cộng đồng
          </p>
        </div>

        {/* Community Demand Pill Indicator */}
        <div className="flex items-center gap-2 bg-kyoto-800/80 px-3 py-1.5 rounded-xl border border-kyoto-700/60 self-start sm:self-auto">
          <span className="text-xs text-gray-300">
            {currentProduct?.icon} Nhu cầu {currentProduct?.name}:
          </span>
          <span className="font-extrabold text-champagne-300 text-xs sm:text-sm">
            {communityQty} {currentProduct?.unit}
          </span>
          {communityQty > 0 && referenceQty !== communityQty && (
            <button
              type="button"
              onClick={handleApplyCommunityQty}
              className="px-2 py-0.5 rounded-md bg-champagne-400 text-kyoto-950 text-[11px] font-black hover:bg-champagne-300 transition-colors shadow-sm active:scale-95"
            >
              Dùng {communityQty}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-900/40 border border-amber-500/50 text-amber-200 flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main 4 Fields in a compact 1-line / multi-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Nhóm sản phẩm */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              1. Nhóm sản phẩm <span className="text-champagne-400">*</span>
            </label>
            <select
              value={categoryKey}
              onChange={(e) => {
                const newCat = e.target.value as ProductKey;
                setCategoryKey(newCat);
                const qty = communityDemandMap[newCat] || 0;
                if (qty > 0) setReferenceQty(qty);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-kyoto-700 bg-kyoto-800 text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-champagne-400"
            >
              {PRODUCTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.icon} {p.name} ({communityDemandMap[p.key] || 0} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Thương hiệu (Combobox) */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              2. Thương hiệu <span className="text-champagne-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="brand-suggestions"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Panasonic, LG, Sony..."
                required
                className="w-full px-3 py-2.5 rounded-xl border border-kyoto-700 bg-kyoto-800 text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-champagne-400"
              />
              <datalist id="brand-suggestions">
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 3. Mã Model (Focus target) */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              3. Mã Model <span className="text-champagne-400">*</span>
            </label>
            <input
              ref={modelInputRef}
              type="text"
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value.toUpperCase())}
              placeholder="VD: NR-TX461GPKV"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-champagne-400/60 bg-kyoto-950 text-champagne-200 font-black text-xs sm:text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-champagne-400 placeholder:text-gray-500 shadow-inner"
            />
          </div>

          {/* 4. Nhu cầu tham khảo */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              4. Nhu cầu tham khảo <span className="text-champagne-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={9999}
                value={referenceQty}
                onChange={(e) => setReferenceQty(Math.max(Number(e.target.value) || 1, 1))}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-kyoto-700 bg-kyoto-800 text-white text-xs sm:text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-champagne-400"
              />
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                {currentProduct?.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible: Extra optional details */}
        <div>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1.5 text-xs text-champagne-300/80 hover:text-champagne-200 font-semibold transition-colors"
          >
            {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Thông tin thêm (Không bắt buộc: Tên đầy đủ, Thông số, Ghi chú)</span>
          </button>

          {showMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tên sản phẩm đầy đủ
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Tủ lạnh Panasonic Inverter 405L 2 cánh"
                  className="w-full px-3 py-2 rounded-lg border border-kyoto-700 bg-kyoto-800 text-xs text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Thông số / Điểm lưu ý
                </label>
                <input
                  type="text"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="VD: Mặt gương đen, lấy nước ngoài, ngăn đông mềm"
                  className="w-full px-3 py-2 rounded-lg border border-kyoto-700 bg-kyoto-800 text-xs text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-champagne-400 to-amber-500 hover:from-champagne-300 hover:to-amber-400 text-kyoto-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-gold active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-kyoto-950 border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu model...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ THÊM MODEL (Enter)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
