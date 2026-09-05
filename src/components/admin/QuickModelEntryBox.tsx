'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PRODUCTS, COMMON_BRANDS } from '@/lib/constants';
import { ProductKey } from '@/types/demand';
import { SupplierTenderItem, TenderItemType } from '@/types/supplier';
import { Plus, Sparkles, ChevronDown, ChevronUp, AlertCircle, Copy, Layers, Wrench } from 'lucide-react';

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
  const [categoryKey, setCategoryKey] = useState<string>('curtain');
  const [itemType, setItemType] = useState<TenderItemType>('SERVICE_SPEC');
  const [unit, setUnit] = useState<string>('m²');
  const [brand, setBrand] = useState('Rèm Cửa');
  const [modelCode, setModelCode] = useState('');
  const [referenceQty, setReferenceQty] = useState(100);
  const [productName, setProductName] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const modelInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill quantity from community demand when category changes
  const communityQty = communityDemandMap[categoryKey as ProductKey] || 0;
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
        setDuplicateWarning(`Hạng mục/Model ${brand} ${modelCode} đã có trong danh sách đợt này!`);
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
      if (clonedItem.item_type) setItemType(clonedItem.item_type);
      if (clonedItem.unit) setUnit(clonedItem.unit);
      if (clonedItem.brand) setBrand(clonedItem.brand);
      if (clonedItem.model_code) setModelCode(clonedItem.model_code);
      if (clonedItem.reference_qty) setReferenceQty(clonedItem.reference_qty);
      if (clonedItem.product_name) setProductName(clonedItem.product_name);
      if (clonedItem.specifications) setSpecifications(clonedItem.specifications);
      modelInputRef.current?.focus();
      if (onClearCloned) onClearCloned();
    }
  }, [clonedItem, onClearCloned]);

  // Quick Preset Helper for common Tender Round #02 items
  const applyPreset = (preset: {
    categoryKey: string;
    itemType: TenderItemType;
    unit: string;
    brand: string;
    modelCode: string;
    productName: string;
    qty: number;
    specs: string;
  }) => {
    setCategoryKey(preset.categoryKey);
    setItemType(preset.itemType);
    setUnit(preset.unit);
    setBrand(preset.brand);
    setModelCode(preset.modelCode);
    setProductName(preset.productName);
    setReferenceQty(preset.qty);
    setSpecifications(preset.specs);
    modelInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedBrand = brand.trim();
    const trimmedModel = modelCode.trim().toUpperCase();

    if (!trimmedBrand) {
      setErrorMsg('Vui lòng chọn hoặc nhập Thương hiệu / Nhóm');
      return;
    }

    if (!trimmedModel) {
      setErrorMsg('Vui lòng nhập Mã Model / Quy cách');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/tenders/${tenderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_key: categoryKey,
          item_type: itemType,
          unit: unit.trim() || 'bộ',
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
        throw new Error(json.error || 'Lỗi khi thêm hạng mục');
      }

      onItemAdded(json.data);

      // Reset for consecutive fast addition:
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
            <span>Thêm Nhanh Hạng Mục / Model Mời Chào Giá</span>
          </h3>
          <p className="text-xs text-gray-300">
            Hỗ trợ cả Sản phẩm theo Model (Điện máy, Giàn phơi...) & Dịch vụ thi công theo quy cách (Rèm cửa, Lưới an toàn...)
          </p>
        </div>

        {/* Community Demand Pill Indicator */}
        <div className="flex items-center gap-2 bg-kyoto-800/80 px-3 py-1.5 rounded-xl border border-kyoto-700/60 self-start sm:self-auto">
          <span className="text-xs text-gray-300">
            {currentProduct?.icon || '📦'} Nhu cầu {currentProduct?.name || categoryKey}:
          </span>
          <span className="font-extrabold text-champagne-300 text-xs sm:text-sm">
            {communityQty} {unit}
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

      {/* Quick Presets for Tender #02 (Rèm, Lưới, Giàn phơi) */}
      <div className="mb-4 bg-kyoto-950/60 p-3 rounded-xl border border-kyoto-800/80">
        <div className="text-[11px] font-bold text-champagne-300/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Điền nhanh mẫu chuẩn Đợt #02 (1-chạm):</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() =>
              applyPreset({
                categoryKey: 'curtain',
                itemType: 'SERVICE_SPEC',
                unit: 'm²',
                brand: 'Rèm Cửa',
                modelCode: 'REM-1-LOP',
                productName: 'Rèm vải 1 lớp',
                qty: 100,
                specs: 'Vải cản sáng 1 lớp, may hoàn thiện, thanh ray, phụ kiện, đo đạc và lắp đặt trọn gói',
              })
            }
            className="px-2.5 py-1 rounded-lg bg-kyoto-800 hover:bg-kyoto-700 text-white font-semibold border border-kyoto-700 active:scale-95 transition-all"
          >
            🪟 + Rèm vải 1 lớp
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                categoryKey: 'curtain',
                itemType: 'SERVICE_SPEC',
                unit: 'm²',
                brand: 'Rèm Cửa',
                modelCode: 'REM-2-LOP',
                productName: 'Rèm vải 2 lớp (Vải chính + Voan)',
                qty: 150,
                specs: 'Vải chính + lớp voan may hoàn thiện, ray đôi, phụ kiện, đo đạc, lắp đặt',
              })
            }
            className="px-2.5 py-1 rounded-lg bg-kyoto-800 hover:bg-kyoto-700 text-white font-semibold border border-kyoto-700 active:scale-95 transition-all"
          >
            🪟 + Rèm vải 2 lớp
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                categoryKey: 'curtain',
                itemType: 'SERVICE_SPEC',
                unit: 'm²',
                brand: 'Rèm Cửa',
                modelCode: 'REM-CAU-VONG',
                productName: 'Rèm cầu vồng Hàn Quốc',
                qty: 80,
                specs: 'Rèm cầu vồng, giá trực tiếp hoặc chiết khấu % theo catalog',
              })
            }
            className="px-2.5 py-1 rounded-lg bg-kyoto-800 hover:bg-kyoto-700 text-white font-semibold border border-kyoto-700 active:scale-95 transition-all"
          >
            🪟 + Rèm cầu vồng
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                categoryKey: 'curtain',
                itemType: 'SERVICE_SPEC',
                unit: 'm²',
                brand: 'Rèm Cửa',
                modelCode: 'REM-TO-ONG',
                productName: 'Rèm tổ ong cách nhiệt',
                qty: 30,
                specs: 'Rèm tổ ong ngăn nhiệt điều hòa, ray và lắp đặt',
              })
            }
            className="px-2.5 py-1 rounded-lg bg-kyoto-800 hover:bg-kyoto-700 text-white font-semibold border border-kyoto-700 active:scale-95 transition-all"
          >
            🪟 + Rèm tổ ong
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                categoryKey: 'safety_net',
                itemType: 'SERVICE_SPEC',
                unit: 'm²',
                brand: 'Lưới An Toàn',
                modelCode: 'LUOI-AT-BAN-CONG',
                productName: 'Lưới an toàn ban công / Cửa sổ',
                qty: 120,
                specs: 'Cáp inox 304 bọc nhựa / trần, thanh nhôm định hình dập vít nở, đo đạc và thi công trọn gói',
              })
            }
            className="px-2.5 py-1 rounded-lg bg-kyoto-800 hover:bg-kyoto-700 text-white font-semibold border border-kyoto-700 active:scale-95 transition-all"
          >
            🛡️ + Lưới an toàn
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                categoryKey: 'drying_rack',
                itemType: 'PRODUCT_MODEL',
                unit: 'bộ',
                brand: 'Hòa Phát',
                modelCode: 'HP-KS950',
                productName: 'Giàn phơi thông minh gắn trần tay quay liền',
                qty: 40,
                specs: '2 thanh nhôm 2.2m, dây cáp inox lụa, củ quay tay liền, trọn gói lắp đặt',
              })
            }
            className="px-2.5 py-1 rounded-lg bg-kyoto-800 hover:bg-kyoto-700 text-white font-semibold border border-kyoto-700 active:scale-95 transition-all"
          >
            👕 + Giàn phơi thông minh
          </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Nhóm sản phẩm */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-gray-200 mb-1">
              1. Nhóm <span className="text-champagne-400">*</span>
            </label>
            <select
              value={categoryKey}
              onChange={(e) => {
                const newCat = e.target.value;
                setCategoryKey(newCat);
                if (newCat === 'curtain' || newCat === 'safety_net') {
                  setItemType('SERVICE_SPEC');
                  setUnit('m²');
                  setBrand(newCat === 'curtain' ? 'Rèm Cửa' : 'Lưới An Toàn');
                } else {
                  setItemType('PRODUCT_MODEL');
                  setUnit('chiếc');
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-kyoto-700 bg-kyoto-800 text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-champagne-400"
            >
              <optgroup label="Hạng mục Đợt #02">
                <option value="curtain">🪟 Rèm cửa (4 loại chuẩn)</option>
                <option value="safety_net">🛡️ Lưới an toàn (Ban công/Cửa sổ)</option>
                <option value="drying_rack">👕 Giàn phơi thông minh</option>
              </optgroup>
              <optgroup label="Sản phẩm điện máy & nội thất khác">
                {PRODUCTS.filter((p) => p.key !== 'curtain' && p.key !== 'drying_rack').map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 2. Loại hạng mục (Model vs Dịch vụ thi công) */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              2. Loại hạng mục <span className="text-champagne-400">*</span>
            </label>
            <select
              value={itemType}
              onChange={(e) => {
                const t = e.target.value as TenderItemType;
                setItemType(t);
                if (t === 'SERVICE_SPEC' && unit === 'chiếc') setUnit('m²');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-kyoto-700 bg-kyoto-800 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-champagne-400"
            >
              <option value="SERVICE_SPEC">Thi công quy cách</option>
              <option value="PRODUCT_MODEL">Sản phẩm Model</option>
            </select>
          </div>

          {/* 3. Đơn vị tính */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              3. Đơn vị tính <span className="text-champagne-400">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-kyoto-700 bg-kyoto-800 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-champagne-400"
            >
              <option value="m²">m² (Mét vuông)</option>
              <option value="m ngang">m ngang (Mét dài)</option>
              <option value="bộ">bộ</option>
              <option value="chiếc">chiếc</option>
              <option value="gói">gói</option>
            </select>
          </div>

          {/* 4. Thương hiệu / Dòng */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              4. Thương hiệu / Nhóm <span className="text-champagne-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="brand-suggestions"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Rèm Cửa, Hòa Phát, Panasonic..."
                required
                className="w-full px-3 py-2.5 rounded-xl border border-kyoto-700 bg-kyoto-800 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-champagne-400"
              />
              <datalist id="brand-suggestions">
                <option value="Rèm Cửa" />
                <option value="Lưới An Toàn" />
                <option value="Hòa Phát" />
                <option value="Sankaku" />
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 5. Mã Model / Mã Quy cách */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1">
              5. Mã / Quy cách <span className="text-champagne-400">*</span>
            </label>
            <input
              ref={modelInputRef}
              type="text"
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value.toUpperCase())}
              placeholder="VD: REM-2-LOP, HP-KS950"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-champagne-400/60 bg-kyoto-950 text-champagne-200 font-black text-xs uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-champagne-400 placeholder:text-gray-500 shadow-inner"
            />
          </div>
        </div>

        {/* Collapsible: Extra details */}
        <div>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1.5 text-xs text-champagne-300/80 hover:text-champagne-200 font-semibold transition-colors"
          >
            {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Thông tin bổ sung (Tên đầy đủ, Nhu cầu tham khảo, Quy cách thi công chi tiết)</span>
          </button>

          {showMore && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tên sản phẩm / Dịch vụ đầy đủ
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Rèm vải 2 lớp may hoàn thiện kèm ray đôi"
                  className="w-full px-3 py-2 rounded-lg border border-kyoto-700 bg-kyoto-800 text-xs text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nhu cầu tham khảo ({unit})
                </label>
                <input
                  type="number"
                  min={1}
                  value={referenceQty}
                  onChange={(e) => setReferenceQty(Math.max(Number(e.target.value) || 1, 1))}
                  className="w-full px-3 py-2 rounded-lg border border-kyoto-700 bg-kyoto-800 text-xs text-white font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Mô tả / Điểm lưu ý thi công
                </label>
                <input
                  type="text"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="VD: Bao gồm vật tư, thanh ray, đo đạc và lắp đặt trọn gói"
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
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ THÊM HẠNG MỤC (Enter)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
