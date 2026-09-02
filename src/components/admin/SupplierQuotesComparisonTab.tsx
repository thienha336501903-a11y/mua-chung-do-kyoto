'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SupplierTender, ModelComparisonGroup, SupplierQuoteRecord } from '@/types/supplier';
import { ProductKey } from '@/types/demand';
import { PRODUCTS } from '@/lib/constants';
import { formatNumber, formatDateTimeVietnam } from '@/lib/utils';
import {
  DollarSign,
  Award,
  Download,
  Filter,
  CheckCircle2,
  Star,
  PhoneCall,
  Sparkles,
  Search,
  ArrowUpDown,
  Layers,
  Building,
  Tag,
  ShieldCheck,
  Truck,
  Wrench,
  Flame,
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
  const [selectedCategory, setSelectedCategory] = useState<ProductKey | 'all'>('all');
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
        // Refresh quotes
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
            q.submission?.contact_person.toLowerCase().includes(s)
        );
        if (!matchModel && !matchQuoteSupplier) return false;
      }
      if (onlyShortlisted) {
        const hasShortlisted = group.quotes.some((q) => q.is_shortlisted) || group.alternative_quotes.some((q) => q.is_shortlisted);
        if (!hasShortlisted) return false;
      }
      if (onlyInStock) {
        const hasStock = group.quotes.some((q) => q.stock_status === 'in_stock');
        if (!hasStock) return false;
      }
      return true;
    });
  }, [comparisonData, selectedCategory, search, onlyShortlisted, onlyInStock]);

  const totalQuotesCount = comparisonData?.allQuotes.length || 0;

  return (
    <div className="space-y-6">
      {/* Top Controls: Tender Picker, Search, Filter & CSV Export */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
            Đợt chào giá:
          </label>
          <select
            value={selectedTenderId}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 bg-gray-50 focus:bg-white"
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
              placeholder="Tìm theo Model, Hãng, Đại lý..."
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
            Tất cả ({filteredGroups.length} model)
          </button>
          {PRODUCTS.map((p) => {
            const isCat = selectedCategory === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedCategory(p.key)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  isCat
                    ? 'bg-kyoto-900 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
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
            <span>Chỉ xem Sẵn hàng</span>
          </label>
        </div>
      </div>

      {/* Model Cards Comparison Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 font-bold">Đang tải bảng so sánh giá...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-card">
          <p className="text-gray-500 font-medium">Không tìm thấy model nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const pConfig = PRODUCTS.find((p) => p.key === group.item.category_key);
            const hasQuotes = group.quotes.length > 0;
            const hasAlternatives = group.alternative_quotes.length > 0;

            return (
              <div
                key={group.item.id}
                className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden"
              >
                {/* Model Header */}
                <div className="bg-gradient-to-r from-kyoto-950 via-kyoto-900 to-kyoto-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kyoto-800">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pConfig?.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-champagne-300 uppercase tracking-wider">
                          {pConfig?.name} • {group.item.brand}
                        </span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
                        {group.item.model_code}
                      </h4>
                      {group.item.product_name && (
                        <p className="text-xs text-gray-300 font-normal">{group.item.product_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Header Info: Community Demand & Lowest Price */}
                  <div className="flex items-center gap-3">
                    <div className="bg-kyoto-800/90 px-3 py-1.5 rounded-xl border border-kyoto-700 text-left">
                      <div className="text-[10px] text-gray-400 font-medium">Nhu cầu tham khảo:</div>
                      <div className="text-sm font-extrabold text-white">
                        {group.item.reference_qty} {pConfig?.unit}
                      </div>
                    </div>

                    {group.lowest_price !== null && (
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 font-black text-xs sm:text-sm animate-pulse">
                        <Award className="w-4 h-4 fill-white" />
                        <span>GIÁ THẤP NHẤT: {formatNumber(group.lowest_price)}₫</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Quotes Table */}
                <div className="p-4 sm:p-5">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-kyoto-800" />
                    <span>Báo giá trực tiếp đúng model ({group.quotes.length} nhà cung cấp)</span>
                  </div>

                  {!hasQuotes ? (
                    <div className="py-6 text-center text-xs text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      Chưa có nhà cung cấp nào gửi báo giá cho model này.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-[11px] uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Nhà Cung Cấp / Đại Lý</th>
                            <th className="py-2.5 px-3">Liên Hệ</th>
                            <th className="py-2.5 px-3 text-right">Giá Chào (VNĐ)</th>
                            <th className="py-2.5 px-3 text-center">Tình Trạng Hàng</th>
                            <th className="py-2.5 px-3 text-center">Điều Kiện (VAT/Ship/Lắp)</th>
                            <th className="py-2.5 px-3 text-center">Bảo Hành</th>
                            <th className="py-2.5 px-3">Ghi Chú</th>
                            <th className="py-2.5 px-3 text-center">Đánh Giá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {group.quotes.map((q) => {
                            const sub = q.submission;
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
                                {/* Company Name */}
                                <td className="py-3 px-3">
                                  <div className="font-extrabold text-gray-900 text-sm">
                                    {sub?.company_name}
                                  </div>
                                  {sub?.address_region && (
                                    <div className="text-[11px] text-gray-500">{sub.address_region}</div>
                                  )}
                                </td>

                                {/* Contact Person & Phone */}
                                <td className="py-3 px-3">
                                  <div className="font-bold text-gray-800">{sub?.contact_person}</div>
                                  <div className="text-xs text-emerald-800 font-bold font-mono">
                                    📞 {sub?.phone_number}
                                  </div>
                                  {sub?.email && (
                                    <div className="text-[11px] text-gray-500">{sub.email}</div>
                                  )}
                                </td>

                                {/* Price with Lowest Highlight */}
                                <td className="py-3 px-3 text-right">
                                  <div className="text-base font-black text-kyoto-950 font-mono">
                                    {formatNumber(Number(q.unit_price))}₫
                                  </div>
                                  {q.is_lowest && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300">
                                      💰 Giá thấp nhất
                                    </span>
                                  )}
                                </td>

                                {/* Stock Status */}
                                <td className="py-3 px-3 text-center">
                                  {q.stock_status === 'in_stock' ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      Sẵn {q.available_qty}
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      Đặt trước ({q.lead_time_days || '—'} ngày)
                                    </span>
                                  )}
                                </td>

                                {/* Included Perks: VAT, Ship, Installation */}
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <span
                                      title={q.is_vat_included ? 'Đã gồm VAT' : 'Chưa gồm VAT'}
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        q.is_vat_included
                                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                          : 'bg-gray-100 text-gray-400 line-through'
                                      }`}
                                    >
                                      VAT
                                    </span>
                                    <span
                                      title={q.is_shipping_included ? 'Miễn phí vận chuyển' : 'Không free ship'}
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        q.is_shipping_included
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-gray-100 text-gray-400 line-through'
                                      }`}
                                    >
                                      Ship
                                    </span>
                                    <span
                                      title={q.is_installation_included ? 'Bao gồm lắp đặt' : 'Không kèm lắp đặt'}
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        q.is_installation_included
                                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                          : 'bg-gray-100 text-gray-400 line-through'
                                      }`}
                                    >
                                      Lắp đặt
                                    </span>
                                  </div>
                                </td>

                                {/* Warranty */}
                                <td className="py-3 px-3 text-center text-xs font-semibold text-gray-700">
                                  {q.warranty_months ? `${q.warranty_months} tháng` : '—'}
                                </td>

                                {/* Quote Notes */}
                                <td className="py-3 px-3 text-xs text-gray-600 max-w-xs truncate">
                                  {q.quote_note || <span className="text-gray-300">-</span>}
                                </td>

                                {/* Actions: Shortlist & Selected for Contact */}
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
                                    {formatNumber(Number(alt.unit_price))}₫
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
