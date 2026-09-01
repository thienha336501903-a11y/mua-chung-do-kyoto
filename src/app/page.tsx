'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import QuickTicker from '@/components/QuickTicker';
import HeroSection from '@/components/HeroSection';
import DemandBarChart from '@/components/DemandBarChart';
import ProductCardGrid from '@/components/ProductCardGrid';
import RegistrationForm from '@/components/RegistrationForm';
import SuccessModal from '@/components/SuccessModal';
import Disclaimer from '@/components/Disclaimer';
import Footer from '@/components/Footer';
import { DemandSummaryData, ProductKey } from '@/types/demand';
import { PRODUCTS } from '@/lib/constants';

const defaultSummary: DemandSummaryData = {
  total_households: 0,
  products: PRODUCTS.map((p) => ({
    key: p.key,
    name: p.name,
    icon: p.icon,
    unit: p.unit,
    total_qty: 0,
    households_count: 0,
    is_highest: false,
  })),
  highest_quantity: 0,
  highest_products: [],
  updated_at: new Date().toISOString(),
};

export default function HomePage() {
  const [summary, setSummary] = useState<DemandSummaryData>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [successData, setSuccessData] = useState<{
    zalo_name: string;
    apartment_number: string;
    phone_number?: string;
    items: { key: ProductKey; name: string; icon: string; quantity: number; unit: string }[];
    isUpdate: boolean;
  } | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/demands/summary', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data);
      }
    } catch (err) {
      console.error('Error loading demand summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRegistrationSuccess = (submitted: {
    zalo_name: string;
    apartment_number: string;
    phone_number?: string;
    items: { key: ProductKey; name: string; icon: string; quantity: number; unit: string }[];
    isUpdate: boolean;
  }) => {
    setSuccessData(submitted);
    // Reload community summary immediately
    fetchSummary();
  };

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900 flex flex-col font-sans selection:bg-champagne-200 selection:text-kyoto-950">
      {/* 1. Sticky Header */}
      <Header />

      {/* 2. Quick Ticker Banner */}
      <QuickTicker
        products={summary.products}
        totalHouseholds={summary.total_households}
        highestProducts={summary.highest_products}
        highestQty={summary.highest_quantity}
      />

      {/* 3. Hero Section */}
      <HeroSection
        totalHouseholds={summary.total_households}
        highestProducts={summary.highest_products}
        highestQty={summary.highest_quantity}
      />

      {/* 4. Main Body Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Visual Bar Chart */}
        <DemandBarChart
          products={summary.products}
          highestQty={summary.highest_quantity}
        />

        {/* 9 Product Cards Grid */}
        <ProductCardGrid
          products={summary.products}
          totalHouseholds={summary.total_households}
        />

        {/* Registration Form */}
        <RegistrationForm onSuccess={handleRegistrationSuccess} />

        {/* Disclaimer */}
        <Disclaimer />
      </main>

      {/* 5. Success Modal */}
      <SuccessModal
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        data={successData}
      />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
