'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SupplierTender, ModelComparisonGroup, SupplierQuoteRecord } from '@/types/supplier';
import { ProductKey } from '@/types/demand';
import { PRODUCTS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import {
  Award,
  Download,
  Star,
  PhoneCall,
  Sparkles,
  Search,
  Building,
  ExternalLink,
} from 'lucide-react';

interface SupplierQuotesComparisonTabProps {
  tenders: SupplierTender[];
}

export default function SupplierQuotesComparisonTab({
  tenders,
}: SupplierQuotesComparisonTabProps) {
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<{
    tender: SupplierTender | null;
    itemsWithQuotes: ModelComparisonGroup[];
    allQuotes: SupplierQuoteRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyShortlisted, setOnlyShortlisted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [search, setSearch] = useState('');

  const fetchQuotes = async (tenderId?: string) => {
    try {
      setLoading(true);
      const url = tenderId ? `/api/admin/quotes?tender_id=${tenderId}` : '/api/admin/quotes';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setComparisonData(json.data);
        if (json.data.tender && !selectedTenderId) {
          setSelectedTenderId(json.data.tender.id);
        }
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes(selectedTenderId);
  }, [selectedTenderId]);

  // Toggle Shortlist on a quote
  const handleToggleShortlist = async (quote: SupplierQuoteRecord) => {
    try {
      const newStatus = !quote.is_shortlisted;
      const res = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_shortlisted: newStatus }),
      });
      if (res.ok) {
        fetchQuotes(selectedTenderId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Selected For Contact on a quote
  const handleToggleSelectedForContact = async (quote: SupplierQuoteRecord) => {
    try {
      const newStatus = !quote.is_selected_for_contact;
      const res = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_selected_for_contact: newStatus }),
      });
      if (res.ok) {
        fetchQuotes(selectedTenderId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered comparison groups
  const filteredGroups = useMemo(() => {
    if (!comparisonData) return [];
    return comparisonData.itemsWithQuotes.filter((group) => {
      if (selectedCategory !== 'all' && group.item.category_key !== selectedCategory) {
        return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const matchModel =
          group.item.model_code.toLowerCase().includes(s) ||
          group.item.brand.toLowerCase().includes(s) ||
          (group.item.product_name && group.item.product_name.toLowerCase().includes(s));
        const matchQuoteSupplier = group.quotes.some(
          (q) =>
            q.submission?.company_name.toLowerCase().includes(s) ||
            q.submission?.contact_person.toLowerCase().includes(s) ||
            (q.plan_name && q.plan_name.toLowerCase().includes(s))
        );
        if (!matchModel && !matchQuoteSupplier) return false;
      }
      if (onlyShortlisted) {
        const hasShortlisted =
          group.quotes.some((q) => q.is_shortlisted) ||
          group.alternative_quotes.some((q) => q.is_shortlisted);
        if (!hasShortlisted) return false;
      }
      if (onlyInStock) {
        const hasStock = group.quotes.some((q) => q.stock_status === 'in_stock');
        if (!hasStock) return false;
      }
      return true;
    });
  }, [comparisonData, selectedCategory, search, onlyShortlisted, onlyInStock]);

  // Distinct category keys in current tender
  const availableCategories = useMemo(() => {
    if (!comparisonData) return [];
    const keys = new Set(comparisonData.itemsWithQuotes.map((g) => g.item.category_key));
    return Array.from(keys);
  }, [comparisonData]);

  return (
    <div className="space-y-6">
      {/* Top Controls: Tender Picker, Search & CSV Export */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
            Đợt chào giá:
          </label>
          <select
            value={selectedTenderId}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 bg-gray-50 focus:bg-white max-w-md"
          >
            {tenders.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Hạng mục, Model, Đại lý..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-kyoto-700"
            />
          </div>
        </div>

        {/* Right Buttons: Export CSV */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/quotes/export-csv${selectedTenderId ? `?tender_id=${selectedTenderId}` : ''}`}
            download
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel/CSV Báo Giá</span>
          </a>
        </div>
      </div>

      {/* Category Pills & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-kyoto-900 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Tất cả ({filteredGroups.length} hạng mục)
          </button>

          {availableCategories.map((catKey) => {
            const isCat = selectedCategory === catKey;
            const pConfig = PRODUCTS.find((p) => p.key === catKey);
            const label =
              catKey === 'curtain'
                ? '🪟 Rèm Cửa'
                : catKey === 'safety_net'
                ? '🛡️ Lưới An Toàn'
                : catKey === 'drying_rack'
                ? '👕 Giàn Phơi'
                : `${pConfig?.icon || '📦'} ${pConfig?.name || catKey}`;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  isCat
                    ? 'bg-kyoto-900 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <input
              type="checkbox"
              checked={onlyShortlisted}
              onChange={(e) => setOnlyShortlisted(e.target.checked)}
              className="rounded text-kyoto-700"
            />
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Chỉ xem Shortlist</span>
          </label>

          <label className="inline-flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded text-kyoto-700"
            />
            <span>Chỉ xem Sẵn hàng/Thi công ngay</span>
          </label>
        </div>
      </div>

      {/* Comparison Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 font-bold">Đang tải bảng so sánh giá...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-card">
          <p className="text-gray-500 font-medium">Không tìm thấy hạng mục nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const pConfig = PRODUCTS.find((p) => p.key === group.item.category_key);
            const isService = group.item.item_type === 'SERVICE_SPEC';
            const categoryIcon =
              group.item.category_key === 'safety_net'
                ? '🛡️'
                : group.item.category_key === 'curtain'
                ? '🪟'
                : group.item.category_key === 'drying_rack'
                ? '👕'
                : pConfig?.icon || '📦';

            const categoryTitle =
              group.item.category_key === 'safety_net'
                ? 'Lưới An Toàn'
                : group.item.category_key === 'curtain'
                ? 'Rèm Cửa'
                : group.item.category_key === 'drying_rack'
                ? 'Giàn Phơi'
                : pConfig?.name || group.item.category_key;

            const hasQuotes = group.quotes.length > 0;
            const hasAlternatives = group.alternative_quotes.length > 0;

            return (
              <div
                key={group.item.id}
                className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden"
              >
                {/* Header for item */}
                <div className="bg-gradient-to-r from-kyoto-950 via-kyoto-900 to-kyoto-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kyoto-800">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{categoryIcon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-champagne-300 uppercase tracking-wider">
                          {categoryTitle} • {group.item.brand}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${
                            isService
                              ? 'bg-purple-900/60 text-purple-200 border border-purple-400/40'
                              : 'bg-blue-900/60 text-blue-200 border border-blue-400/40'
                          }`}
                        >
                          {isService ? 'Thi công quy cách' : 'Model sản phẩm'}
                        </span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
                        {group.item.product_name || group.item.model_code}
                      </h4>
                      {group.item.specifications && (
                        <p className="text-xs text-gray-300 font-normal">{group.item.specifications}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Header Info: Unit, Reference qty & Lowest Price */}
                  <div className="flex items-center gap-3">
                    <div className="bg-kyoto-800/90 px-3 py-1.5 rounded-xl border border-kyoto-700 text-left">
                      <div className="text-[10px] text-gray-400 font-medium">Nhu cầu tham khảo:</div>
                      <div className="text-sm font-extrabold text-white">
                        {group.item.reference_qty} {group.item.unit || 'bộ'}
                      </div>
                    </div>

                    {group.lowest_price !== null && (
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 font-black text-xs sm:text-sm animate-pulse">
                        <Award className="w-4 h-4 fill-white" />
                        <span>
                          GIÁ THẤP NHẤT: {formatNumber(group.lowest_price)}₫ / {group.item.unit || 'bộ'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Quotes Table */}
                <div className="p-4 sm:p-5">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-kyoto-800" />
                    <span>Báo giá trực tiếp ({group.quotes.length} nhà cung cấp / phương án)</span>
                  </div>

                  {!hasQuotes ? (
                    <div className="py-6 text-center text-xs text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      Chưa có đơn vị nào gửi báo giá cho hạng mục này.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-[11px] uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Nhà Cung Cấp / Đại Lý</th>
                            <th className="py-2.5 px-3">Phương Án / Model</th>
                            <th className="py-2.5 px-3 text-right">Giá Thực Tế / So Sánh</th>
                            <th className="py-2.5 px-3">Thông Số & Quy Cách</th>
                            <th className="py-2.5 px-3 text-center">Bao Gồm (VAT/Lắp/Đo)</th>
                            <th className="py-2.5 px-3 text-center">Bảo Hành</th>
                            <th className="py-2.5 px-3">Catalog / Ghi Chú</th>
                            <th className="py-2.5 px-3 text-center">Đánh Giá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {group.quotes.map((q) => {
                            const sub = q.submission;
                            const isDiscount = q.pricing_mode === 'catalog_discount';
                            const effPrice = Number(q.effective_price || q.unit_price);

                            return (
                              <tr
                                key={q.id}
                                className={`transition-colors ${
                                  q.is_lowest
                                    ? 'bg-amber-50/60 font-semibold'
                                    : q.is_shortlisted
                                    ? 'bg-champagne-50/50'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                {/* 1. Company Name & Contact */}
                                <td className="py-3 px-3">
                                  <div className="font-extrabold text-gray-900 text-sm">
                                    {sub?.company_name}
                                  </div>
                                  <div className="text-xs text-emerald-800 font-bold font-mono">
                                    📞 {sub?.phone_number} ({sub?.contact_person})
                                  </div>
                                  {sub?.address_region && (
                                    <div className="text-[11px] text-gray-500">{sub.address_region}</div>
                                  )}
                                </td>

                                {/* 2. Plan Name / Model / Brand */}
                                <td className="py-3 px-3">
                                  {q.plan_name ? (
                                    <div className="font-bold text-kyoto-900 bg-kyoto-50 px-2 py-0.5 rounded border border-kyoto-200 inline-block mb-1">
                                      {q.plan_name}
                                    </div>
                                  ) : null}
                                  <div className="font-extrabold text-gray-900 text-xs">
                                    {q.brand} {q.model_code}
                                  </div>
                                  {q.product_name && (
                                    <div className="text-[11px] text-gray-600">{q.product_name}</div>
                                  )}
                                </td>

                                {/* 3. Effective Price with Breakdown */}
                                <td className="py-3 px-3 text-right">
                                  <div className="text-base font-black text-kyoto-950 font-mono">
                                    {formatNumber(effPrice)}₫ <span className="text-xs font-semibold text-gray-500">/{q.unit || group.item.unit || 'bộ'}</span>
                                  </div>
                                  {isDiscount && q.list_price && (
                                    <div className="text-[11px] text-gray-500">
                                      Gốc: <span className="line-through">{formatNumber(q.list_price)}₫</span> (-{q.discount_percent}%)
                                    </div>
                                  )}
                                  {q.is_lowest && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300 mt-0.5">
                                      💰 Giá thấp nhất
                                    </span>
                                  )}
                                </td>

                                {/* 4. Technical Specs (Fabric, Wire, Load, etc.) */}
                                <td className="py-3 px-3 text-xs max-w-xs">
                                  {q.fabric_main && (
                                    <div><strong>Vải chính:</strong> {q.fabric_main}</div>
                                  )}
                                  {q.fabric_sheer && (
                                    <div><strong>Voan:</strong> {q.fabric_sheer}</div>
                                  )}
                                  {q.wire_spec && (
                                    <div><strong>Dây cáp:</strong> {q.wire_spec} {q.wire_diameter_mm ? `(${q.wire_diameter_mm}mm)` : ''}</div>
                                  )}
                                  {q.wire_spacing_cm && (
                                    <div><strong>Khoảng cách:</strong> {q.wire_spacing_cm}cm</div>
                                  )}
                                  {q.frame_spec && (
                                    <div><strong>Khung:</strong> {q.frame_spec}</div>
                                  )}
                                  {q.load_capacity_kg && (
                                    <div><strong>Tải trọng:</strong> {q.load_capacity_kg}kg ({q.drying_bars_count || 2} thanh)</div>
                                  )}
                                  {q.material && (
                                    <div><strong>Vật liệu:</strong> {q.material}</div>
                                  )}
                                </td>

                                {/* 5. Included Perks (VAT, Ship, Install, Survey) */}
                                <td className="py-3 px-3 text-center">
                                  <div className="flex flex-wrap items-center justify-center gap-1 text-xs">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        q.is_installation_included
                                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                          : 'bg-gray-100 text-gray-400 line-through'
                                      }`}
                                      title={q.is_installation_included ? 'Đã gồm lắp đặt' : 'Không kèm lắp đặt'}
                                    >
                                      Lắp đặt
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        q.is_survey_included !== false
                                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                          : 'bg-gray-100 text-gray-400 line-through'
                                      }`}
                                      title={q.is_survey_included !== false ? 'Đã gồm đo đạc / khảo sát' : 'Không kèm khảo sát'}
                                    >
                                      Đo đạc
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        q.is_vat_included
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-gray-100 text-gray-400 line-through'
                                      }`}
                                      title={q.is_vat_included ? 'Đã gồm VAT' : 'Chưa gồm VAT'}
                                    >
                                      VAT
                                    </span>
                                  </div>
                                </td>

                                {/* 6. Warranty */}
                                <td className="py-3 px-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">
                                  {q.warranty_months ? `${q.warranty_months} tháng` : '—'}
                                </td>

                                {/* 7. Catalog & Notes */}
                                <td className="py-3 px-3 text-xs max-w-xs">
                                  {q.catalog_url && (
                                    <div className="mb-1">
                                      <a
                                        href={q.catalog_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-kyoto-800 hover:text-kyoto-950 hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>Xem Catalog</span>
                                      </a>
                                    </div>
                                  )}
                                  {q.quote_note && (
                                    <div className="text-[11px] text-gray-500 italic">{q.quote_note}</div>
                                  )}
                                  {!q.catalog_url && !q.quote_note && (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>

                                {/* 8. Actions: Shortlist & Selected For Contact */}
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-2">
                                    {/* Shortlist Star */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleShortlist(q)}
                                      title={q.is_shortlisted ? 'Bỏ Shortlist' : 'Thêm vào Shortlist'}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        q.is_shortlisted
                                          ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-400'
                                          : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'
                                      }`}
                                    >
                                      <Star className={`w-4 h-4 ${q.is_shortlisted ? 'fill-amber-500' : ''}`} />
                                    </button>

                                    {/* Contact Checkbox */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSelectedForContact(q)}
                                      title={q.is_selected_for_contact ? 'Bỏ đánh dấu chọn liên hệ' : 'Đánh dấu ĐÃ CHỌN ĐỂ LIÊN HỆ'}
                                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                        q.is_selected_for_contact
                                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                          : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                                      }`}
                                    >
                                      <PhoneCall className="w-3.5 h-3.5" />
                                      <span>{q.is_selected_for_contact ? 'Đã Chọn' : 'Chọn'}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Alternative Models Proposal Area */}
                  {hasAlternatives && (
                    <div className="mt-4 pt-4 border-t border-kyoto-100 bg-champagne-50/40 p-4 rounded-xl border border-champagne-300/60">
                      <div className="text-xs font-black text-champagne-950 uppercase tracking-tight mb-2.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Model Tương Đương / Tốt Hơn Được Đề Xuất Thay Thế ({group.alternative_quotes.length})</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.alternative_quotes.map((alt) => {
                          const sub = alt.submission;
                          return (
                            <div
                              key={alt.id}
                              className="bg-white rounded-xl p-3.5 border border-champagne-200 shadow-sm flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-extrabold text-sm text-kyoto-950 font-mono">
                                    {alt.brand} {alt.model_code}
                                  </span>
                                  <span className="font-black text-base text-emerald-800 font-mono">
                                    {formatNumber(Number(alt.effective_price || alt.unit_price))}₫ /{alt.unit || 'bộ'}
                                  </span>
                                </div>
                                {alt.product_name && (
                                  <p className="text-xs text-gray-700 font-medium mb-1">{alt.product_name}</p>
                                )}
                                {alt.proposal_reason && (
                                  <div className="bg-champagne-100/60 p-2 rounded-lg text-xs text-champagne-950 mb-2 border border-champagne-200">
                                    <strong>💡 Lý do đề xuất:</strong> {alt.proposal_reason}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                                <div>
                                  <span className="font-bold text-gray-800">{sub?.company_name}</span> (📞 {sub?.phone_number})
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleShortlist(alt)}
                                  className={`p-1 rounded ${
                                    alt.is_shortlisted ? 'text-amber-600' : 'text-gray-400 hover:text-amber-500'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${alt.is_shortlisted ? 'fill-amber-500' : ''}`} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
