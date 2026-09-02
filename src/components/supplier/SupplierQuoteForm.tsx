'use client';

import React, { useState } from 'react';
import { SupplierTender, SupplierTenderItem, StockStatus, SubmitSupplierPayload } from '@/types/supplier';
import { PRODUCTS, COMMON_BRANDS } from '@/lib/constants';
import { ProductKey } from '@/types/demand';
import { formatNumber, isValidVietnamesePhone, normalizePhoneNumber } from '@/lib/utils';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Send,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Award,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ItemQuoteState {
  hasQuote: boolean;
  unitPrice: string;
  stockStatus: StockStatus;
  availableQty: number;
  isVatIncluded: boolean;
  isShippingIncluded: boolean;
  isInstallationIncluded: boolean;
  warrantyMonths: string;
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

interface CustomProposal {
  categoryKey: ProductKey;
  brand: string;
  modelCode: string;
  productName: string;
  unitPrice: string;
  availableQty: number;
  reason: string;
}

interface SupplierQuoteFormProps {
  tender: SupplierTender;
  items: SupplierTenderItem[];
}

export default function SupplierQuoteForm({ tender, items }: SupplierQuoteFormProps) {
  // Supplier Info
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [addressRegion, setAddressRegion] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Item Quotes state mapped by item.id
  const [itemQuotes, setItemQuotes] = useState<Record<string, ItemQuoteState>>(() => {
    const map: Record<string, ItemQuoteState> = {};
    items.forEach((it) => {
      map[it.id] = {
        hasQuote: false,
        unitPrice: '',
        stockStatus: 'in_stock',
        availableQty: it.reference_qty || 10,
        isVatIncluded: true,
        isShippingIncluded: true,
        isInstallationIncluded: false,
        warrantyMonths: '24',
        quoteNote: '',
        hasAlternative: false,
        altBrand: it.brand,
        altModel: '',
        altProductName: '',
        altPrice: '',
        altStockStatus: 'in_stock',
        altQty: it.reference_qty || 10,
        altReason: '',
      };
    });
    return map;
  });

  // Custom proposals outside list
  const [customProposals, setCustomProposals] = useState<CustomProposal[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Update single item state
  const updateItemQuote = (itemId: string, updates: Partial<ItemQuoteState>) => {
    setItemQuotes((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...updates },
    }));
  };

  // Add custom proposal row
  const handleAddCustomProposal = () => {
    setCustomProposals([
      ...customProposals,
      {
        categoryKey: 'refrigerator',
        brand: 'Panasonic',
        modelCode: '',
        productName: '',
        unitPrice: '',
        availableQty: 10,
        reason: '',
      },
    ]);
  };

  // Remove custom proposal row
  const handleRemoveCustomProposal = (idx: number) => {
    setCustomProposals(customProposals.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validation
    const trimmedCompany = companyName.trim();
    const trimmedContact = contactPerson.trim();
    const rawPhone = phoneNumber.trim();
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const isTestPhone = rawPhone.includes('__TEST_');

    if (!trimmedCompany) {
      setErrorMsg('Vui lòng nhập Tên Nhà cung cấp / Đại lý');
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

    // 2. Build quote array
    const quotesPayload: SubmitSupplierPayload['quotes'] = [];

    // Process target items quotes
    items.forEach((it) => {
      const q = itemQuotes[it.id];
      if (!q) return;

      const directPrice = Number(q.unitPrice.replace(/\D/g, '')) || 0;
      if (q.hasQuote && directPrice > 0) {
        quotesPayload.push({
          tender_item_id: it.id,
          is_alternative: false,
          category_key: it.category_key,
          brand: it.brand,
          model_code: it.model_code,
          product_name: it.product_name || undefined,
          unit_price: directPrice,
          stock_status: q.stockStatus,
          available_qty: Number(q.availableQty) || 1,
          is_vat_included: q.isVatIncluded,
          is_shipping_included: q.isShippingIncluded,
          is_installation_included: q.isInstallationIncluded,
          warranty_months: Number(q.warrantyMonths) || undefined,
          quote_note: q.quoteNote.trim() || undefined,
        });
      }

      // Process alternative model quote
      const altPrice = Number(q.altPrice.replace(/\D/g, '')) || 0;
      if (q.hasAlternative && altPrice > 0 && q.altBrand.trim() && q.altModel.trim()) {
        quotesPayload.push({
          tender_item_id: it.id,
          is_alternative: true,
          target_item_id: it.id,
          category_key: it.category_key,
          brand: q.altBrand.trim(),
          model_code: q.altModel.trim().toUpperCase(),
          product_name: q.altProductName.trim() || undefined,
          unit_price: altPrice,
          stock_status: q.altStockStatus,
          available_qty: Number(q.altQty) || 1,
          is_vat_included: q.isVatIncluded,
          is_shipping_included: q.isShippingIncluded,
          is_installation_included: q.isInstallationIncluded,
          proposal_reason: q.altReason.trim() || undefined,
        });
      }
    });

    // Process custom proposals
    customProposals.forEach((cp) => {
      const pPrice = Number(cp.unitPrice.replace(/\D/g, '')) || 0;
      if (pPrice > 0 && cp.brand.trim() && cp.modelCode.trim()) {
        quotesPayload.push({
          is_alternative: true,
          category_key: cp.categoryKey,
          brand: cp.brand.trim(),
          model_code: cp.modelCode.trim().toUpperCase(),
          product_name: cp.productName.trim() || undefined,
          unit_price: pPrice,
          stock_status: 'in_stock',
          available_qty: Number(cp.availableQty) || 1,
          is_vat_included: true,
          is_shipping_included: true,
          proposal_reason: cp.reason.trim() || undefined,
        });
      }
    });

    if (quotesPayload.length === 0) {
      setErrorMsg('Vui lòng nhập báo giá cho ít nhất 1 sản phẩm bạn có thể cung cấp');
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

      // Trigger Confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
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
      {/* Intro Box */}
      <div className="bg-gradient-to-br from-kyoto-950 via-kyoto-900 to-kyoto-950 text-white rounded-3xl p-6 sm:p-10 shadow-card border border-champagne-400/40 text-center mb-8 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-champagne-400/20 text-champagne-300 border border-champagne-400/40 text-xs font-bold mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MỜI CHÀO GIÁ MUA CHUNG</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight mb-3">
          {tender.title}
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed mb-4">
          {tender.description ||
            'Cộng đồng cư dân Kyoto đang tổng hợp nhu cầu mua chung. Các đại lý / nhà phân phối có thể gửi mức giá tốt nhất cho các model cộng đồng đang quan tâm.'}
        </p>

        <div className="inline-flex items-center gap-2 bg-kyoto-800/80 px-4 py-2 rounded-xl text-xs text-champagne-200 border border-kyoto-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Báo giá của Quý đại lý được bảo mật riêng tư, chỉ Ban đại diện xem xét để liên hệ làm việc.</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm font-semibold animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: SUPPLIER INFO */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-card border border-gray-200">
          <h2 className="text-base sm:text-lg font-black text-kyoto-950 uppercase tracking-tight mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-kyoto-800" />
            <span>1. Thông Tin Nhà Cung Cấp / Đại Lý</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tên Nhà cung cấp / Đại lý / Cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="VD: Điện Máy Xanh Chi Nhánh..., Tổng Kho Điện Máy..., Công Ty TNHH..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
              />
            </div>

            {/* Contact Person */}
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

            {/* Phone / Zalo */}
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

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: daily@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
              />
            </div>

            {/* Address / Region */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Khu vực kho hàng / Địa chỉ
              </label>
              <input
                type="text"
                value={addressRegion}
                onChange={(e) => setAddressRegion(e.target.value)}
                placeholder="VD: Hà Nội, Kho Đông Anh, Kho Long Biên..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700 shadow-sm"
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

        {/* SECTION 2: TENDER ITEMS LIST */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-card border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-kyoto-950 uppercase tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-700" />
                <span>2. Báo Giá Cho Các Model Cư Dân Quan Tâm ({items.length} Model)</span>
              </h2>
              <p className="text-xs text-gray-500">
                Quý đại lý chỉ cần báo giá cho những model có thể cung cấp. Các model khác có thể bỏ qua.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((it) => {
              const pConfig = PRODUCTS.find((p) => p.key === it.category_key);
              const qState = itemQuotes[it.id] || {
                hasQuote: false,
                unitPrice: '',
                stockStatus: 'in_stock',
                availableQty: 10,
                isVatIncluded: true,
                isShippingIncluded: true,
                isInstallationIncluded: false,
                warrantyMonths: '24',
                quoteNote: '',
                hasAlternative: false,
                altBrand: it.brand,
                altModel: '',
                altProductName: '',
                altPrice: '',
                altStockStatus: 'in_stock',
                altQty: 10,
                altReason: '',
              };

              return (
                <div
                  key={it.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                    qState.hasQuote
                      ? 'bg-kyoto-50/40 border-kyoto-600 shadow-sm ring-1 ring-kyoto-600/30'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Model Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">{pConfig?.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-kyoto-800 uppercase tracking-wider">
                            {pConfig?.name} • {it.brand}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 font-mono">
                          {it.model_code}
                        </h3>
                        {it.product_name && (
                          <p className="text-xs text-gray-600 font-normal">{it.product_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Reference Qty Badge & Toggle Button */}
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <div className="bg-gray-100 px-2.5 py-1 rounded-lg text-left">
                        <span className="text-[10px] text-gray-500 block">Nhu cầu tham khảo:</span>
                        <span className="text-xs font-black text-gray-800">
                          {it.reference_qty} {pConfig?.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateItemQuote(it.id, { hasQuote: !qState.hasQuote })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          qState.hasQuote
                            ? 'bg-kyoto-800 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-kyoto-100 hover:text-kyoto-900 border border-gray-200'
                        }`}
                      >
                        {qState.hasQuote ? '✓ Đã chọn báo giá' : '+ Báo giá model này'}
                      </button>
                    </div>
                  </div>

                  {/* Quote Input Area (Expanded when hasQuote is true) */}
                  {qState.hasQuote && (
                    <div className="mt-4 pt-4 border-t border-kyoto-200/80 space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Unit Price */}
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Giá chào (VNĐ / {pConfig?.unit}) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={qState.unitPrice}
                            onChange={(e) => updateItemQuote(it.id, { unitPrice: e.target.value })}
                            placeholder="VD: 12500000"
                            required={qState.hasQuote}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 font-black text-base text-kyoto-950 font-mono shadow-inner focus:outline-none focus:ring-2 focus:ring-kyoto-700"
                          />
                        </div>

                        {/* Stock Status */}
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Tình trạng hàng
                          </label>
                          <select
                            value={qState.stockStatus}
                            onChange={(e) => updateItemQuote(it.id, { stockStatus: e.target.value as StockStatus })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                          >
                            <option value="in_stock">Sẵn hàng tại kho</option>
                            <option value="pre_order">Cần đặt trước (Order)</option>
                          </select>
                        </div>

                        {/* Available Qty */}
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Số lượng sẵn sàng cấp
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={qState.availableQty}
                            onChange={(e) => updateItemQuote(it.id, { availableQty: Number(e.target.value) || 1 })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-center"
                          />
                        </div>
                      </div>

                      {/* Perk Checkboxes & Warranty */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 text-xs">
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={qState.isVatIncluded}
                              onChange={(e) => updateItemQuote(it.id, { isVatIncluded: e.target.checked })}
                              className="rounded text-kyoto-700"
                            />
                            <span>Đã bao gồm VAT</span>
                          </label>

                          <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={qState.isShippingIncluded}
                              onChange={(e) => updateItemQuote(it.id, { isShippingIncluded: e.target.checked })}
                              className="rounded text-kyoto-700"
                            />
                            <span>Miễn phí vận chuyển</span>
                          </label>

                          <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={qState.isInstallationIncluded}
                              onChange={(e) => updateItemQuote(it.id, { isInstallationIncluded: e.target.checked })}
                              className="rounded text-kyoto-700"
                            />
                            <span>Bao gồm lắp đặt</span>
                          </label>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 font-semibold">Bảo hành:</span>
                          <input
                            type="text"
                            value={qState.warrantyMonths}
                            onChange={(e) => updateItemQuote(it.id, { warrantyMonths: e.target.value })}
                            placeholder="24"
                            className="w-14 px-2 py-1 rounded border border-gray-300 text-xs text-center font-bold"
                          />
                          <span className="text-gray-500">tháng</span>
                        </div>
                      </div>

                      {/* Alternative Model Toggle */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuote(it.id, { hasAlternative: !qState.hasAlternative })}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-champagne-800 hover:text-champagne-950 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>
                            {qState.hasAlternative
                              ? '[-] Ẩn đề xuất model tương đương'
                              : '[+] Tôi có model khác tương đương / tốt hơn với giá tốt'}
                          </span>
                        </button>

                        {qState.hasAlternative && (
                          <div className="mt-3 p-4 rounded-xl bg-champagne-50 border border-champagne-300/80 space-y-3 animate-fadeIn">
                            <div className="text-xs font-black text-champagne-950 uppercase tracking-tight">
                              Đề xuất model thay thế cho {it.model_code}:
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Hãng thay thế
                                </label>
                                <input
                                  type="text"
                                  value={qState.altBrand}
                                  onChange={(e) => updateItemQuote(it.id, { altBrand: e.target.value })}
                                  placeholder="VD: Toshiba, LG, Sony..."
                                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Mã Model thay thế
                                </label>
                                <input
                                  type="text"
                                  value={qState.altModel}
                                  onChange={(e) => updateItemQuote(it.id, { altModel: e.target.value.toUpperCase() })}
                                  placeholder="VD: GR-RT468WE"
                                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-black uppercase font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Giá chào thay thế (VNĐ)
                                </label>
                                <input
                                  type="text"
                                  value={qState.altPrice}
                                  onChange={(e) => updateItemQuote(it.id, { altPrice: e.target.value })}
                                  placeholder="VD: 11800000"
                                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-black font-mono text-emerald-800"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Lý do đề xuất / Điểm tương đương nổi bật
                              </label>
                              <input
                                type="text"
                                value={qState.altReason}
                                onChange={(e) => updateItemQuote(it.id, { altReason: e.target.value })}
                                placeholder="VD: Dung tích 411L tương đương, công nghệ Inverter kép, sẵn kho giao ngay"
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section: Custom Proposals outside list */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-kyoto-800" />
                <span>Đề xuất thêm sản phẩm / model khác ngoài danh sách</span>
              </h3>

              <button
                type="button"
                onClick={handleAddCustomProposal}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-kyoto-100 text-kyoto-900 font-bold text-xs flex items-center gap-1 border border-gray-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm đề xuất</span>
              </button>
            </div>

            {customProposals.map((cp, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 mb-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700">Đề xuất #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomProposal(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={cp.categoryKey}
                    onChange={(e) => {
                      const updated = [...customProposals];
                      updated[idx].categoryKey = e.target.value as ProductKey;
                      setCustomProposals(updated);
                    }}
                    className="px-2 py-1.5 rounded border border-gray-300 font-bold"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={cp.brand}
                    onChange={(e) => {
                      const updated = [...customProposals];
                      updated[idx].brand = e.target.value;
                      setCustomProposals(updated);
                    }}
                    placeholder="Hãng (VD: LG)"
                    className="px-2 py-1.5 rounded border border-gray-300 font-bold"
                  />

                  <input
                    type="text"
                    value={cp.modelCode}
                    onChange={(e) => {
                      const updated = [...customProposals];
                      updated[idx].modelCode = e.target.value.toUpperCase();
                      setCustomProposals(updated);
                    }}
                    placeholder="Mã Model"
                    className="px-2 py-1.5 rounded border border-gray-300 font-black font-mono uppercase"
                  />

                  <input
                    type="text"
                    value={cp.unitPrice}
                    onChange={(e) => {
                      const updated = [...customProposals];
                      updated[idx].unitPrice = e.target.value;
                      setCustomProposals(updated);
                    }}
                    placeholder="Giá chào (VNĐ)"
                    className="px-2 py-1.5 rounded border border-gray-300 font-black font-mono text-emerald-800"
                  />
                </div>

                <input
                  type="text"
                  value={cp.reason}
                  onChange={(e) => {
                    const updated = [...customProposals];
                    updated[idx].reason = e.target.value;
                    setCustomProposals(updated);
                  }}
                  placeholder="Lý do đề xuất deal này cho cư dân..."
                  className="w-full px-2 py-1.5 rounded border border-gray-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: GENERAL NOTE */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-card border border-gray-200">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Ghi chú chung / Chính sách ưu đãi thêm cho cộng đồng Kyoto (Không bắt buộc)
          </label>
          <textarea
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            rows={3}
            placeholder="VD: Hỗ trợ thanh toán sau khi nhận hàng, tặng thêm quà tặng voucher, chính sách bảo hành 1 đổi 1 trong 30 ngày..."
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
            📌 Việc gửi báo giá không đồng nghĩa với việc được lựa chọn cung cấp. Ban đại diện cư dân Kyoto sẽ tổng hợp, so sánh và chủ động liên hệ với Quý nhà cung cấp có mức giá và chính sách phù hợp nhất.
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
              Ban đại diện cư dân chung cư Kyoto chân thành cảm ơn <strong>{companyName}</strong> đã gửi báo giá tốt cho cộng đồng. Chúng tôi sẽ tổng hợp, so sánh và chủ động liên hệ tới số điện thoại <strong>{phoneNumber}</strong> ({contactPerson}) nếu mức giá phù hợp.
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
