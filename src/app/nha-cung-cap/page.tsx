'use client';

import React, { useEffect, useState } from 'react';
import SupplierHeader from '@/components/supplier/SupplierHeader';
import SupplierQuoteForm from '@/components/supplier/SupplierQuoteForm';
import Footer from '@/components/Footer';
import { SupplierTender, SupplierTenderItem } from '@/types/supplier';
import { Sparkles, Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SupplierPublicPage() {
  const [tender, setTender] = useState<SupplierTender | null>(null);
  const [items, setItems] = useState<SupplierTenderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActiveTender() {
      try {
        const res = await fetch('/api/supplier/tenders/active');
        const json = await res.json();
        if (json.success && json.data) {
          setTender(json.data.tender);
          setItems(json.data.items || []);
        }
      } catch (err) {
        console.error('Error fetching active tender:', err);
      } finally {
        setLoading(false);
      }
    }
    loadActiveTender();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900 flex flex-col font-sans selection:bg-champagne-200 selection:text-kyoto-950">
      <SupplierHeader />

      <main className="flex-1">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-kyoto-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-600">Đang tải thông tin đợt chào giá...</p>
          </div>
        ) : !tender || tender.status !== 'open' ? (
          <div className="max-w-2xl mx-auto py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
              ⏳
            </div>
            <h2 className="text-2xl font-black text-kyoto-950 mb-2">
              Chưa Có Đợt Chào Giá Đang Mở
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Hiện tại Ban đại diện cư dân Kyoto chưa mở đợt tiếp nhận báo giá mới hoặc đợt chào giá trước đó đã kết thúc. Quý Nhà phân phối / Đại lý vui lòng quay lại sau!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kyoto-800 text-white text-xs font-bold hover:bg-kyoto-900 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Chủ Khảo Sát Cư Dân</span>
            </Link>
          </div>
        ) : (
          <SupplierQuoteForm tender={tender} items={items} />
        )}
      </main>

      <Footer />
    </div>
  );
}
