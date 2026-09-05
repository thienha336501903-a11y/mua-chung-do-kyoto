'use client';

import React, { useState } from 'react';
import {
  SupplierTender,
  SupplierTenderItem,
  StockStatus,
  SubmitSupplierPayload,
  PricingMode,
} from '@/types/supplier';
import { PRODUCTS, COMMON_BRANDS } from '@/lib/constants';
import { formatNumber, isValidVietnamesePhone, normalizePhoneNumber } from '@/lib/utils';
import {
  Building2,
  DollarSign,
  AlertCircle,
  Send,
  Sparkles,
  Plus,
  Trash2,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ItemPlanState {
  id: string; // unique local ID for each plan
  planName: string;
  pricingMode: PricingMode;
  listPrice: string;
  discountPercent: string;
  unitPrice: string; // direct price or calculated
  unit: string;
  stockStatus: StockStatus;
  availableQty: number;
  isVatIncluded: boolean;
  isShippingIncluded: boolean;
  isInstallationIncluded: boolean;
  isMaterialsIncluded: boolean;
  isSurveyIncluded: boolean;
  minOrderValue: string;
  warrantyMonths: string;
  leadTimeDays: string;
  fabricMain: string;
  fabricSheer: string;
  material: string;
  wireSpec: string;
  wireDiameterMm: string;
  wireSpacingCm: string;
  frameSpec: string;
  loadCapacityKg: string;
  dryingBarsCount: string;
  catalogUrl: string;
  catalogCode: string;
  quoteNote: string;
  // Alternative Model
  hasAlternative: boolean;
  altBrand: string;
  altModel: string;
  altProductName: string;
  altPrice: string;
  altStockStatus: StockStatus;
  altQty: number;
  altReason: string;
}

interface SupplierQuoteFormProps {
  tender: SupplierTender;
  items: SupplierTenderItem[];
}

export default function SupplierQuoteForm({ tender, items }: SupplierQuoteFormProps) {
  // Supplier Contact Info
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [addressRegion, setAddressRegion] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [catalogGeneralUrl, setCatalogGeneralUrl] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Category Selection Filters: which category does this supplier want to quote?
  const hasCurtainItems = items.some((it) => it.category_key === 'curtain');
  const hasSafetyNetItems = items.some((it) => it.category_key === 'safety_net');
  const hasDryingRackItems = items.some((it) => it.category_key === 'drying_rack');

  const [selectedCategories, setSelectedCategories] = useState<{
    curtain: boolean;
    safety_net: boolean;
    drying_rack: boolean;
    other: boolean;
  }>({
    curtain: true,
    safety_net: true,
    drying_rack: true,
    other: true,
  });

  // Initial plan state constructor
  const createDefaultPlan = (item: SupplierTenderItem, index = 1): ItemPlanState => {
    const isCurtain = item.category_key === 'curtain';
    const isSafetyNet = item.category_key === 'safety_net';

    return {
      id: `${item.id}-${Date.now()}-${Math.random()}`,
      planName: isCurtain ? (index === 1 ? 'Phương án Tiêu chuẩn' : `Phương án #${index}`) : '',
      pricingMode: isCurtain && item.model_code.includes('CAU-VONG') ? 'catalog_discount' : 'direct',
      listPrice: '',
      discountPercent: '30',
      unitPrice: '',
      unit: item.unit || (isCurtain || isSafetyNet ? 'm²' : 'bộ'),
      stockStatus: 'in_stock',
      availableQty: item.reference_qty || 10,
      isVatIncluded: false,
      isShippingIncluded: true,
      isInstallationIncluded: true,
      isMaterialsIncluded: true,
      isSurveyIncluded: true,
      minOrderValue: '',
      warrantyMonths: '24',
      leadTimeDays: isCurtain || isSafetyNet ? '3' : '1',
      fabricMain: '',
      fabricSheer: '',
      material: '',
      wireSpec: isSafetyNet ? 'Cáp inox 304 bọc nhựa chống gỉ' : '',
      wireDiameterMm: isSafetyNet ? '3.0' : '',
      wireSpacingCm: isSafetyNet ? '5.0' : '',
      frameSpec: isSafetyNet ? 'Thanh nhôm định hình dập vít nở chuyên dụng' : '',
      loadCapacityKg: item.category_key === 'drying_rack' ? '60' : '',
      dryingBarsCount: item.category_key === 'drying_rack' ? '2' : '',
      catalogUrl: '',
      catalogCode: '',
      quoteNote: '',
      hasAlternative: false,
      altBrand: item.brand || '',
      altModel: '',
      altProductName: '',
      altPrice: '',
      altStockStatus: 'in_stock',
      altQty: 10,
      altReason: '',
    };
  };

  // Plans mapped by item.id -> array of plans
  const [itemPlans, setItemPlans] = useState<Record<string, ItemPlanState[]>>(() => {
    const map: Record<string, ItemPlanState[]> = {};
    items.forEach((it) => {
      map[it.id] = [createDefaultPlan(it, 1)];
    });
    return map;
  });

  // Toggled items that supplier wants to quote
  const [activeItemIds, setActiveItemIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    items.forEach((it) => {
      map[it.id] = false;
    });
    return map;
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Toggle item active state
  const handleToggleItem = (itemId: string) => {
    setActiveItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Add another plan for an item
  const handleAddPlan = (item: SupplierTenderItem) => {
    const currentPlans = itemPlans[item.id] || [];
    const newPlan = createDefaultPlan(item, currentPlans.length + 1);
    setItemPlans((prev) => ({
      ...prev,
      [item.id]: [...currentPlans, newPlan],
    }));
  };

  // Remove a plan
  const handleRemovePlan = (itemId: string, planIndex: number) => {
    const currentPlans = itemPlans[itemId] || [];
    if (currentPlans.length <= 1) return;
    setItemPlans((prev) => ({
      ...prev,
      [itemId]: currentPlans.filter((_, idx) => idx !== planIndex),
    }));
  };

  // Update a specific plan
  const handleUpdatePlan = (itemId: string, planIndex: number, updates: Partial<ItemPlanState>) => {
    setItemPlans((prev) => {
      const plans = [...(prev[itemId] || [])];
      plans[planIndex] = { ...plans[planIndex], ...updates };
      return { ...prev, [itemId]: plans };
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Contact Validation
    const trimmedCompany = companyName.trim();
    const trimmedContact = contactPerson.trim();
    const rawPhone = phoneNumber.trim();
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const isTestPhone = rawPhone.includes('__TEST_');

    if (!trimmedCompany) {
      setErrorMsg('Vui lòng nhập Tên Nhà cung cấp / Đơn vị thi công');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (!trimmedContact) {
      setErrorMsg('Vui lòng nhập Người liên hệ');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (!rawPhone || (!isTestPhone && !isValidVietnamesePhone(normalizedPhone))) {
      setErrorMsg('Vui lòng nhập số điện thoại / Zalo hợp lệ (Ví dụ: 0912 345 678)');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // 2. Build Quotes Payload
    const quotesPayload: SubmitSupplierPayload['quotes'] = [];

    items.forEach((it) => {
      if (!activeItemIds[it.id]) return;

      const plans = itemPlans[it.id] || [];
      plans.forEach((p) => {
        let directPrice = Number(p.unitPrice.replace(/\D/g, '')) || 0;
        const isCatalogDiscount = p.pricingMode === 'catalog_discount';
        const listPriceNum = Number(p.listPrice.replace(/\D/g, '')) || 0;
        const discountNum = Number(p.discountPercent) || 0;

        if (isCatalogDiscount && listPriceNum > 0) {
          directPrice = Math.round(listPriceNum * (1 - Math.min(Math.max(discountNum, 0), 100) / 100));
        }

        if (directPrice > 0) {
          quotesPayload.push({
            tender_item_id: it.id,
            is_alternative: false,
            item_type: it.item_type || 'PRODUCT_MODEL',
            category_key: it.category_key,
            brand: it.brand,
            model_code: it.model_code,
            product_name: it.product_name || undefined,
            plan_name: p.planName.trim() || undefined,
            unit: p.unit || it.unit || 'bộ',
            pricing_mode: p.pricingMode,
            list_price: isCatalogDiscount ? listPriceNum : undefined,
            discount_percent: isCatalogDiscount ? discountNum : undefined,
            effective_price: directPrice,
            unit_price: directPrice,
            stock_status: p.stockStatus,
            available_qty: Number(p.availableQty) || 10,
            is_vat_included: p.isVatIncluded,
            is_shipping_included: p.isShippingIncluded,
            is_installation_included: p.isInstallationIncluded,
            is_materials_included: p.isMaterialsIncluded,
            is_survey_included: p.isSurveyIncluded,
            min_order_value: p.minOrderValue ? Number(p.minOrderValue.replace(/\D/g, '')) : undefined,
            warranty_months: p.warrantyMonths ? Number(p.warrantyMonths) : undefined,
            lead_time_days: p.leadTimeDays ? Number(p.leadTimeDays) : undefined,
            fabric_main: p.fabricMain.trim() || undefined,
            fabric_sheer: p.fabricSheer.trim() || undefined,
            material: p.material.trim() || undefined,
            wire_spec: p.wireSpec.trim() || undefined,
            wire_diameter_mm: p.wireDiameterMm ? Number(p.wireDiameterMm) : undefined,
            wire_spacing_cm: p.wireSpacingCm ? Number(p.wireSpacingCm) : undefined,
            frame_spec: p.frameSpec.trim() || undefined,
            load_capacity_kg: p.loadCapacityKg ? Number(p.loadCapacityKg) : undefined,
            drying_bars_count: p.dryingBarsCount ? Number(p.dryingBarsCount) : undefined,
            catalog_url: p.catalogUrl.trim() || catalogGeneralUrl.trim() || undefined,
            catalog_code: p.catalogCode.trim() || undefined,
            quote_note: p.quoteNote.trim() || undefined,
          });
        }

        // Alternative model quote
        const altPriceNum = Number(p.altPrice.replace(/\D/g, '')) || 0;
        if (p.hasAlternative && altPriceNum > 0 && p.altBrand.trim() && p.altModel.trim()) {
          quotesPayload.push({
            tender_item_id: it.id,
            is_alternative: true,
            target_item_id: it.id,
            item_type: it.item_type || 'PRODUCT_MODEL',
            category_key: it.category_key,
            brand: p.altBrand.trim(),
            model_code: p.altModel.trim().toUpperCase(),
            product_name: p.altProductName.trim() || undefined,
            unit: p.unit || it.unit || 'bộ',
            unit_price: altPriceNum,
            effective_price: altPriceNum,
            stock_status: p.altStockStatus,
            available_qty: Number(p.altQty) || 10,
            is_vat_included: p.isVatIncluded,
            is_shipping_included: p.isShippingIncluded,
            is_installation_included: p.isInstallationIncluded,
            proposal_reason: p.altReason.trim() || undefined,
          });
        }
      });
    });

    if (quotesPayload.length === 0) {
      setErrorMsg('Vui lòng chọn và nhập báo giá cho ít nhất 1 hạng mục mà đơn vị có thể cung cấp');
      return;
    }

    setLoading(true);

    try {
      const payload: SubmitSupplierPayload = {
        tender_id: tender.id,
        company_name: trimmedCompany,
        contact_person: trimmedContact,
        phone_number: isTestPhone ? rawPhone : normalizedPhone,
        email: email.trim() || undefined,
        address_region: addressRegion.trim() || undefined,
        general_note: generalNote.trim() || undefined,
        honeypot,
        quotes: quotesPayload,
      };

      const res = await fetch('/api/supplier/quotes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi gửi báo giá');
      }

      setIsSuccess(true);

      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0c3b2e', '#bb8a52', '#22c55e', '#eab308'],
        });
      } catch {}
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra khi gửi báo giá, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Banner Intro */}
      <div className="bg-gradient-to-br from-kyoto-950 via-kyoto-900 to-kyoto-950 text-white rounded-3xl p-6 sm:p-10 shadow-card border border-champagne-400/40 text-center mb-8 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-champagne-400/20 text-champagne-300 border border-champagne-400/40 text-xs font-bold mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MỜI CHÀO GIÁ MUA CHUNG DỰ ÁN KYOTO</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight mb-3">
          {tender.title}
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed mb-4">
          {tender.description ||
            'Cộng đồng cư dân Kyoto đang tổng hợp nhu cầu mua chung. Quý Nhà cung cấp / Đơn vị thi công có thể lựa chọn một hoặc nhiều hạng mục phù hợp để gửi mức giá tốt nhất.'}
        </p>

        <div className="inline-flex items-center gap-2 bg-kyoto-800/80 px-4 py-2 rounded-xl text-xs text-champagne-200 border border-kyoto-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Báo giá của Quý đơn vị được bảo mật riêng tư, chỉ Ban đại diện xem xét để trực tiếp liên hệ.</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm font-semibold animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: SUPPLIER INFO */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-card border border-gray-200">
          <h2 className="text-base sm:text-lg font-black text-kyoto-950 uppercase tracking-tight mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-kyoto-800" />
            <span>1. Thông Tin Đơn Vị Thi Công / Nhà Phân Phối</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tên Nhà cung cấp / Đơn vị thi công / Xưởng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="VD: Rèm Cửa Cao Cấp Ánh Dương, Xưởng Cơ Khí Lưới An Toàn Việt..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Người liên hệ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="VD: Anh Tuấn / Chị Lan"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số điện thoại / Zalo <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 0912 345 678"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: remcuakyoto@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Khu vực xưởng / Kho hàng
              </label>
              <input
                type="text"
                value={addressRegion}
                onChange={(e) => setAddressRegion(e.target.value)}
                placeholder="VD: TP. Thanh Hóa, Quảng Xương, Sầm Sơn, Hà Nội..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Link Website / Catalog mẫu online / Google Drive PDF (Nếu có)
              </label>
              <input
                type="url"
                value={catalogGeneralUrl}
                onChange={(e) => setCatalogGeneralUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700"
              />
            </div>

            {/* Honeypot hidden input */}
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </div>

        {/* SECTION 2: CATEGORY SELECTOR CHECKBOXES */}
        <div className="bg-kyoto-900 text-white rounded-2xl p-5 sm:p-6 shadow-card border border-champagne-400/30">
          <h2 className="text-sm sm:text-base font-black text-champagne-200 uppercase tracking-tight mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-champagne-400" />
            <span>Quý Đơn Vị Muốn Chào Giá Hạng Mục Nào?</span>
          </h2>
          <p className="text-xs text-gray-300 mb-4">
            Tích chọn những nhóm hạng mục Quý đơn vị có thể thi công / cung cấp. Chỉ các nhóm được tích mới mở form chi tiết.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {hasCurtainItems && (
              <label
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-3 ${
                  selectedCategories.curtain
                    ? 'bg-kyoto-800 border-champagne-400 text-white shadow-md'
                    : 'bg-kyoto-950/60 border-kyoto-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.curtain}
                  onChange={(e) =>
                    setSelectedCategories({ ...selectedCategories, curtain: e.target.checked })
                  }
                  className="rounded text-champagne-400 focus:ring-champagne-400 w-4 h-4"
                />
                <div>
                  <div className="font-extrabold text-sm">🪟 Rèm Cửa</div>
                  <div className="text-[11px] text-gray-300">Vải 1-2 lớp, Cầu vồng, Tổ ong</div>
                </div>
              </label>
            )}

            {hasSafetyNetItems && (
              <label
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-3 ${
                  selectedCategories.safety_net
                    ? 'bg-kyoto-800 border-champagne-400 text-white shadow-md'
                    : 'bg-kyoto-950/60 border-kyoto-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.safety_net}
                  onChange={(e) =>
                    setSelectedCategories({ ...selectedCategories, safety_net: e.target.checked })
                  }
                  className="rounded text-champagne-400 focus:ring-champagne-400 w-4 h-4"
                />
                <div>
                  <div className="font-extrabold text-sm">🛡️ Lưới An Toàn</div>
                  <div className="text-[11px] text-gray-300">Ban công & Cửa sổ chung cư</div>
                </div>
              </label>
            )}

            {hasDryingRackItems && (
              <label
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-3 ${
                  selectedCategories.drying_rack
                    ? 'bg-kyoto-800 border-champagne-400 text-white shadow-md'
                    : 'bg-kyoto-950/60 border-kyoto-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.drying_rack}
                  onChange={(e) =>
                    setSelectedCategories({ ...selectedCategories, drying_rack: e.target.checked })
                  }
                  className="rounded text-champagne-400 focus:ring-champagne-400 w-4 h-4"
                />
                <div>
                  <div className="font-extrabold text-sm">👕 Giàn Phơi Thông Minh</div>
                  <div className="text-[11px] text-gray-300">Gắn trần, quay tay liền, điện tử</div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* SECTION 3: TENDER ITEMS WITH SPECIALIZED VIEWS */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-card border border-gray-200">
          <div className="border-b border-gray-100 pb-3 mb-6">
            <h2 className="text-base sm:text-lg font-black text-kyoto-950 uppercase tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-700" />
              <span>3. Chi Tiết Báo Giá Từng Hạng Mục</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Bấm &quot;+ Báo giá hạng mục này&quot; để nhập chi tiết giá hoàn thiện, bảo hành và chính sách. Có thể gửi nhiều phương án.
            </p>
          </div>

          <div className="space-y-6">
            {items
              .filter((it) => {
                if (it.category_key === 'curtain') return selectedCategories.curtain;
                if (it.category_key === 'safety_net') return selectedCategories.safety_net;
                if (it.category_key === 'drying_rack') return selectedCategories.drying_rack;
                return selectedCategories.other;
              })
              .map((it) => {
                const isCurtain = it.category_key === 'curtain';
                const isSafetyNet = it.category_key === 'safety_net';
                const isDryingRack = it.category_key === 'drying_rack';
                const isTwoLayerCurtain = isCurtain && it.model_code.includes('2-LOP');
                const isRainbowCurtain = isCurtain && it.model_code.includes('CAU-VONG');

                const isActive = !!activeItemIds[it.id];
                const plans = itemPlans[it.id] || [createDefaultPlan(it, 1)];

                const icon = isSafetyNet ? '🛡️' : isCurtain ? '🪟' : isDryingRack ? '👕' : '📦';

                return (
                  <div
                    key={it.id}
                    className={`rounded-2xl p-4 sm:p-6 border transition-all ${
                      isActive
                        ? 'bg-kyoto-50/50 border-kyoto-600 shadow-md ring-1 ring-kyoto-600/30'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Item Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-kyoto-800 uppercase tracking-wider">
                              {it.brand}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                              Đơn vị: {it.unit || 'bộ'}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-gray-900">
                            {it.product_name || it.model_code}
                          </h3>
                          {it.specifications && (
                            <p className="text-xs text-gray-600 font-normal mt-0.5">{it.specifications}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <div className="bg-gray-100 px-3 py-1.5 rounded-xl text-left">
                          <span className="text-[10px] text-gray-500 block">Nhu cầu tham khảo:</span>
                          <span className="text-xs font-black text-gray-800">
                            {it.reference_qty} {it.unit || 'bộ'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleItem(it.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                            isActive
                              ? 'bg-kyoto-800 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-kyoto-100 hover:text-kyoto-900 border border-gray-200'
                          }`}
                        >
                          {isActive ? '✓ Đã chọn báo giá' : '+ Báo giá mục này'}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED PLANS FOR THIS ITEM */}
                    {isActive && (
                      <div className="mt-5 pt-5 border-t border-kyoto-200/80 space-y-6 animate-fadeIn">
                        {plans.map((p, pIdx) => {
                          const isDiscountMode = p.pricingMode === 'catalog_discount';
                          const listNum = Number(p.listPrice.replace(/\D/g, '')) || 0;
                          const discNum = Number(p.discountPercent) || 0;
                          const calculatedPrice = isDiscountMode && listNum > 0
                            ? Math.round(listNum * (1 - Math.min(Math.max(discNum, 0), 100) / 100))
                            : Number(p.unitPrice.replace(/\D/g, '')) || 0;

                          return (
                            <div
                              key={p.id}
                              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-4 relative"
                            >
                              {/* Plan Header */}
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-kyoto-900 uppercase">
                                    Phương án #{pIdx + 1}
                                  </span>
                                  {isCurtain && (
                                    <input
                                      type="text"
                                      value={p.planName}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { planName: e.target.value })
                                      }
                                      placeholder="Tên phương án (VD: Vải gấm cao cấp, Tiết kiệm...)"
                                      className="px-2.5 py-1 rounded-lg border border-gray-300 text-xs font-bold text-gray-900 max-w-xs"
                                    />
                                  )}
                                </div>

                                {plans.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlan(it.id, pIdx)}
                                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa phương án</span>
                                  </button>
                                )}
                              </div>

                              {/* PRICING INPUTS */}
                              <div>
                                {isRainbowCurtain ? (
                                  <div className="space-y-3">
                                    {/* Pricing Mode Switcher for Rainbow Curtain */}
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                                      <span>Cách báo giá:</span>
                                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`pricing_mode_${p.id}`}
                                          checked={p.pricingMode === 'catalog_discount'}
                                          onChange={() =>
                                            handleUpdatePlan(it.id, pIdx, { pricingMode: 'catalog_discount' })
                                          }
                                        />
                                        <span>Chiết khấu theo Catalog (%)</span>
                                      </label>
                                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`pricing_mode_${p.id}`}
                                          checked={p.pricingMode === 'direct'}
                                          onChange={() =>
                                            handleUpdatePlan(it.id, pIdx, { pricingMode: 'direct' })
                                          }
                                        />
                                        <span>Giá trực tiếp / m²</span>
                                      </label>
                                    </div>

                                    {isDiscountMode ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                          <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Giá niêm yết Catalog (VNĐ/m²) <span className="text-red-500">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={p.listPrice}
                                            onChange={(e) =>
                                              handleUpdatePlan(it.id, pIdx, { listPrice: e.target.value })
                                            }
                                            placeholder="VD: 550000"
                                            className="w-full px-3 py-2 rounded-xl border border-gray-300 font-black text-sm font-mono text-gray-900"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Chiết khấu (%) <span className="text-red-500">*</span>
                                          </label>
                                          <div className="relative">
                                            <input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={p.discountPercent}
                                              onChange={(e) =>
                                                handleUpdatePlan(it.id, pIdx, { discountPercent: e.target.value })
                                              }
                                              className="w-full px-3 py-2 rounded-xl border border-gray-300 font-black text-sm font-mono text-gray-900 pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-gray-500">
                                              %
                                            </span>
                                          </div>
                                        </div>

                                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex flex-col justify-center">
                                          <span className="text-[11px] font-bold text-emerald-800">
                                            Giá thực tế sau chiết khấu:
                                          </span>
                                          <span className="text-base font-black text-emerald-950 font-mono">
                                            {formatNumber(calculatedPrice)}₫ / m²
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Giá hoàn thiện (VNĐ/m²) <span className="text-red-500">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={p.unitPrice}
                                            onChange={(e) =>
                                              handleUpdatePlan(it.id, pIdx, { unitPrice: e.target.value })
                                            }
                                            placeholder="VD: 380000"
                                            className="w-full px-3 py-2 rounded-xl border border-gray-300 font-black text-base font-mono text-kyoto-950"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Giá hoàn thiện (VNĐ / {p.unit || it.unit || 'bộ'}) <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={p.unitPrice}
                                        onChange={(e) =>
                                          handleUpdatePlan(it.id, pIdx, { unitPrice: e.target.value })
                                        }
                                        placeholder={isSafetyNet ? 'VD: 180000' : 'VD: 350000'}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-300 font-black text-base font-mono text-kyoto-950 shadow-inner"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Đơn vị tính
                                      </label>
                                      <select
                                        value={p.unit}
                                        onChange={(e) =>
                                          handleUpdatePlan(it.id, pIdx, { unit: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                                      >
                                        <option value="m²">m² (Mét vuông)</option>
                                        <option value="m ngang">m ngang (Mét dài)</option>
                                        <option value="bộ">bộ</option>
                                        <option value="chiếc">chiếc</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* SPECIFIC FIELDS PER CATEGORY */}
                              {isCurtain && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      Tên / Mã vải chính (Dòng vải, chất liệu)
                                    </label>
                                    <input
                                      type="text"
                                      value={p.fabricMain}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { fabricMain: e.target.value })
                                      }
                                      placeholder="VD: Vải gấm Bỉ cản sáng 95%, Mã Ruby 08..."
                                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                                    />
                                  </div>

                                  {isTwoLayerCurtain && (
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Tên / Mã lớp voan
                                      </label>
                                      <input
                                        type="text"
                                        value={p.fabricSheer}
                                        onChange={(e) =>
                                          handleUpdatePlan(it.id, pIdx, { fabricSheer: e.target.value })
                                        }
                                        placeholder="VD: Voan xước trắng, voan thêu cao cấp..."
                                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {isSafetyNet && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      Loại dây / Cáp
                                    </label>
                                    <input
                                      type="text"
                                      value={p.wireSpec}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { wireSpec: e.target.value })
                                      }
                                      placeholder="VD: Inox 304 bọc nhựa / Cáp trần"
                                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      Đường kính dây (mm)
                                    </label>
                                    <select
                                      value={p.wireDiameterMm}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { wireDiameterMm: e.target.value })
                                      }
                                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                                    >
                                      <option value="2.5">2.5 mm</option>
                                      <option value="3.0">3.0 mm (Phổ biến)</option>
                                      <option value="3.5">3.5 mm</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      Khoảng cách dây (cm)
                                    </label>
                                    <select
                                      value={p.wireSpacingCm}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { wireSpacingCm: e.target.value })
                                      }
                                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                                    >
                                      <option value="5.0">5.0 cm (Tiêu chuẩn an toàn)</option>
                                      <option value="7.0">7.0 cm</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {isDryingRack && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      Tải trọng chịu lực (kg)
                                    </label>
                                    <input
                                      type="number"
                                      value={p.loadCapacityKg}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { loadCapacityKg: e.target.value })
                                      }
                                      placeholder="60"
                                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      Số thanh phơi & chiều dài
                                    </label>
                                    <input
                                      type="text"
                                      value={p.dryingBarsCount}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { dryingBarsCount: e.target.value })
                                      }
                                      placeholder="2 thanh nhôm 2.2m"
                                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* CHECKBOXES & CONDITIONS */}
                              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                                <div className="flex flex-wrap items-center gap-4">
                                  <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={p.isMaterialsIncluded}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { isMaterialsIncluded: e.target.checked })
                                      }
                                      className="rounded text-kyoto-700"
                                    />
                                    <span>Gồm vật tư / ray</span>
                                  </label>

                                  <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={p.isSurveyIncluded}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { isSurveyIncluded: e.target.checked })
                                      }
                                      className="rounded text-kyoto-700"
                                    />
                                    <span>Gồm đo đạc / khảo sát</span>
                                  </label>

                                  <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={p.isInstallationIncluded}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { isInstallationIncluded: e.target.checked })
                                      }
                                      className="rounded text-kyoto-700"
                                    />
                                    <span>Bao gồm lắp đặt</span>
                                  </label>

                                  <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={p.isVatIncluded}
                                      onChange={(e) =>
                                        handleUpdatePlan(it.id, pIdx, { isVatIncluded: e.target.checked })
                                      }
                                      className="rounded text-kyoto-700"
                                    />
                                    <span>Đã gồm VAT</span>
                                  </label>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500 font-semibold">Bảo hành:</span>
                                  <input
                                    type="text"
                                    value={p.warrantyMonths}
                                    onChange={(e) =>
                                      handleUpdatePlan(it.id, pIdx, { warrantyMonths: e.target.value })
                                    }
                                    placeholder="24"
                                    className="w-14 px-2 py-1 rounded border border-gray-300 text-xs text-center font-bold"
                                  />
                                  <span className="text-gray-500">tháng</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Button: Add another plan */}
                        {isCurtain && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddPlan(it)}
                              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-kyoto-100 text-kyoto-900 font-bold text-xs flex items-center gap-1.5 border border-gray-200 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-kyoto-800" />
                              <span>+ Thêm phương án khác cho {it.product_name || it.model_code}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* SECTION 4: GENERAL NOTE */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-card border border-gray-200">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Ghi chú chung / Chính sách bảo hành & ưu đãi thêm cho cư dân Kyoto (Không bắt buộc)
          </label>
          <textarea
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            rows={3}
            placeholder="VD: Hỗ trợ mang mẫu vải tận nhà đo đạc miễn phí, tặng kèm phụ kiện chặn cửa / khóa an toàn..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-kyoto-700 via-kyoto-800 to-kyoto-900 hover:from-kyoto-800 hover:to-kyoto-950 text-white font-extrabold text-base sm:text-lg shadow-gold active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang gửi báo giá...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 text-champagne-300" />
                <span>GỬI BÁO GIÁ CHO BAN ĐẠI DIỆN CƯ DÂN</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-3 leading-relaxed">
            📌 Việc gửi báo giá không đồng nghĩa với việc được lựa chọn cung cấp. Ban đại diện cư dân Kyoto sẽ tổng hợp, so sánh và chủ động liên hệ với Quý đơn vị có mức giá và chính sách thi công phù hợp nhất.
          </p>
        </div>
      </form>

      {/* SUCCESS MODAL */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-kyoto-100 text-center animate-scaleUp">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
              ✅
            </div>

            <h3 className="text-2xl font-black text-kyoto-950 mb-2">
              ĐÃ GỬI BÁO GIÁ THÀNH CÔNG!
            </h3>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Ban đại diện cư dân chung cư Kyoto chân thành cảm ơn <strong>{companyName}</strong> đã gửi bảng chào giá. Chúng tôi sẽ tổng hợp, so sánh và chủ động liên hệ tới số điện thoại <strong>{phoneNumber}</strong> ({contactPerson}) nếu phương án phù hợp.
            </p>

            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-kyoto-800 text-white font-bold text-sm hover:bg-kyoto-900 shadow-md transition-all"
            >
              Quay lại Trang Chủ
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
