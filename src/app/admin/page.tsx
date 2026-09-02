'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/lib/constants';
import { ProductKey, ResidentDemandRecord } from '@/types/demand';
import { SupplierTender } from '@/types/supplier';
import { formatDateTimeVietnam, formatNumber } from '@/lib/utils';
import AdminTabsNav, { AdminTab } from '@/components/admin/AdminTabsNav';
import TenderManagementTab from '@/components/admin/TenderManagementTab';
import SupplierQuotesComparisonTab from '@/components/admin/SupplierQuotesComparisonTab';
import {
  ShieldCheck,
  Search,
  Download,
  Trash2,
  Edit,
  LogOut,
  RefreshCw,
  Filter,
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('residents');
  const [demands, setDemands] = useState<ResidentDemandRecord[]>([]);
  const [tenders, setTenders] = useState<SupplierTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductKey | 'all'>('all');
  const [editingRecord, setEditingRecord] = useState<ResidentDemandRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Resident Data & Tenders
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/demands');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setDemands(json.data || []);
      }

      // Fetch tenders for quotes & tabs count
      const tendersRes = await fetch('/api/admin/tenders');
      const tendersJson = await tendersRes.json();
      if (tendersJson.success && tendersJson.data) {
        setTenders(tendersJson.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Logout
  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  // Delete Record
  const handleDelete = async (id: string, name: string, apt: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bản ghi của cư dân: ${name} (Căn ${apt})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/demands/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDemands((prev) => prev.filter((d) => d.id !== id));
        showMessage('success', 'Đã xóa bản ghi thành công');
      } else {
        showMessage('error', json.error || 'Lỗi khi xóa');
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Lỗi khi xóa');
    }
  };

  // Cleanup Test Records
  const handleCleanupTest = async () => {
    if (!confirm('Bạn có chắc muốn dọn dẹp toàn bộ dữ liệu test (__TEST_KYOTO_DEMAND__)?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/demands?cleanup_test=true', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showMessage('success', `Đã dọn dẹp ${json.deletedCount} bản ghi kiểm thử`);
        fetchData();
      } else {
        showMessage('error', json.error || 'Lỗi khi dọn dẹp');
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Lỗi khi dọn dẹp');
    }
  };

  // Save Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/demands/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecord),
      });

      const json = await res.json();
      if (json.success) {
        setDemands((prev) =>
          prev.map((d) => (d.id === editingRecord.id ? { ...editingRecord, ...json.data } : d))
        );
        setEditingRecord(null);
        showMessage('success', 'Đã cập nhật bản ghi thành công');
      } else {
        showMessage('error', json.error || 'Lỗi cập nhật');
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Lỗi cập nhật');
    } finally {
      setIsSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Calculated Stats
  const summaryStats = useMemo(() => {
    const stats = {} as Record<ProductKey, { totalQty: number; households: number }>;
    PRODUCTS.forEach((p) => {
      stats[p.key] = { totalQty: 0, households: 0 };
    });

    demands.forEach((d) => {
      PRODUCTS.forEach((p) => {
        const qty = Number((d as any)[p.dbField]) || 0;
        if (qty > 0) {
          stats[p.key].totalQty += qty;
          stats[p.key].households += 1;
        }
      });
    });

    return stats;
  }, [demands]);

  // Map of total community demand quantity for auto-filling
  const communityDemandMap = useMemo(() => {
    const map = {} as Record<ProductKey, number>;
    PRODUCTS.forEach((p) => {
      map[p.key] = summaryStats[p.key]?.totalQty || 0;
    });
    return map;
  }, [summaryStats]);

  // Filtered Demands
  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      // Product Filter
      if (selectedProduct !== 'all') {
        const product = PRODUCTS.find((p) => p.key === selectedProduct);
        if (product) {
          const qty = Number((d as any)[product.dbField]) || 0;
          if (qty <= 0) return false;
        }
      }

      // Search Filter (Zalo name, Apartment number, or Phone number)
      if (search) {
        const searchLower = search.toLowerCase().trim();
        const matchName = d.zalo_name.toLowerCase().includes(searchLower);
        const matchApt = d.apartment_number.toLowerCase().includes(searchLower);
        const matchPhone = d.phone_number ? d.phone_number.toLowerCase().includes(searchLower) : false;
        if (!matchName && !matchApt && !matchPhone) return false;
      }

      return true;
    });
  }, [demands, selectedProduct, search]);

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900 font-sans">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-kyoto-950 via-kyoto-900 to-kyoto-950 text-white border-b border-kyoto-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-champagne-500/20 border border-champagne-400/40 flex items-center justify-center text-champagne-300 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>QUẢN TRỊ KHẢO SÁT KYOTO</span>
                <span className="text-[10px] bg-champagne-400/20 text-champagne-300 px-2 py-0.5 rounded-full border border-champagne-400/40 font-bold uppercase">
                  Admin Portal
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors hidden sm:inline-block"
            >
              Xem trang Public ↗
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-500/40 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Toast Notification */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold animate-fadeIn ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <AdminTabsNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          residentsCount={demands.length}
          tendersCount={tenders.length}
        />

        {/* TAB 2: TENDER MANAGEMENT */}
        {activeTab === 'tenders' && (
          <TenderManagementTab communityDemandMap={communityDemandMap} />
        )}

        {/* TAB 3: SUPPLIER QUOTES COMPARISON */}
        {activeTab === 'quotes' && (
          <SupplierQuotesComparisonTab tenders={tenders} />
        )}

        {/* TAB 1: RESIDENT DEMANDS */}
        {activeTab === 'residents' && (
          <>
            {/* Section 1: Aggregate Overview Cards */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-kyoto-950 uppercase tracking-tight">
                    Tổng Quan Nhu Cầu Toàn Khu
                  </h2>
                </div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  title="Tải lại dữ liệu"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Total Households Card */}
                <div className="bg-gradient-to-br from-kyoto-900 to-kyoto-950 text-white rounded-2xl p-4 shadow-card border border-kyoto-800 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Tổng số hộ</span>
                    <Users className="w-4 h-4 text-champagne-300" />
                  </div>
                  <div className="text-3xl font-black text-champagne-200 tracking-tight">
                    {formatNumber(demands.length)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">căn hộ tham gia</div>
                </div>

                {/* 10 Product Cards */}
                {PRODUCTS.map((p) => {
                  const stat = summaryStats[p.key];
                  return (
                    <div
                      key={p.key}
                      onClick={() =>
                        setSelectedProduct(selectedProduct === p.key ? 'all' : p.key)
                      }
                      className={`rounded-2xl p-3.5 transition-all cursor-pointer border ${
                        selectedProduct === p.key
                          ? 'bg-kyoto-50 border-kyoto-600 shadow-md ring-2 ring-kyoto-600/30'
                          : 'bg-white border-gray-200 hover:border-kyoto-300 shadow-card'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1">
                        <span className="truncate">{p.shortName || p.name}</span>
                        <span>{p.icon}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-kyoto-950">
                          {formatNumber(stat?.totalQty || 0)}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">{p.unit}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        <strong className="text-gray-700">{stat?.households || 0}</strong> hộ cần
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Controls (Search, Filter, Export) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo Tên Zalo, Số căn hộ hoặc Số điện thoại..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-kyoto-700 focus:border-transparent font-medium"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <a
                  href={`/api/admin/export-csv?search=${encodeURIComponent(search)}&product=${selectedProduct}`}
                  download
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất file Excel/CSV</span>
                </a>

                <button
                  onClick={handleCleanupTest}
                  className="px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Xóa các bản ghi có tên __TEST__"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline">Dọn dẹp test</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4 text-xs font-semibold">
              <span className="text-gray-500 flex items-center gap-1 pr-1 flex-shrink-0">
                <Filter className="w-3.5 h-3.5" /> Lọc:
              </span>
              <button
                onClick={() => setSelectedProduct('all')}
                className={`px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                  selectedProduct === 'all'
                    ? 'bg-kyoto-800 text-white font-bold'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Tất cả ({demands.length})
              </button>
              {PRODUCTS.map((p) => {
                const count = summaryStats[p.key]?.households || 0;
                return (
                  <button
                    key={p.key}
                    onClick={() => setSelectedProduct(p.key)}
                    className={`px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors flex items-center gap-1 ${
                      selectedProduct === p.key
                        ? 'bg-kyoto-800 text-white font-bold shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Section 3: Detailed Table */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="text-xs sm:text-sm font-bold text-gray-800">
                  Danh sách chi tiết ({filteredDemands.length} bản ghi)
                </div>
                {selectedProduct !== 'all' && (
                  <span className="text-xs bg-champagne-100 text-champagne-900 px-2.5 py-0.5 rounded-full font-semibold border border-champagne-300">
                    Đang lọc: {PRODUCTS.find((p) => p.key === selectedProduct)?.name}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3">STT</th>
                      <th className="py-3 px-3">Tên Zalo</th>
                      <th className="py-3 px-3 text-kyoto-900 bg-kyoto-50/70">Số Căn Hộ</th>
                      <th className="py-3 px-3 text-emerald-900 bg-emerald-50/70">Số Điện Thoại</th>
                      <th className="py-3 px-2 text-center" title="Tivi">📺 TV</th>
                      <th className="py-3 px-2 text-center" title="Sofa">🛋️ Sofa</th>
                      <th className="py-3 px-2 text-center" title="Rèm">🪟 Rèm</th>
                      <th className="py-3 px-2 text-center" title="Dàn phơi">👕 Phơi</th>
                      <th className="py-3 px-2 text-center" title="Giường">🛏️ Giường</th>
                      <th className="py-3 px-2 text-center" title="Bộ bàn ghế ăn">🍽️ Bàn Ăn</th>
                      <th className="py-3 px-2 text-center" title="Tủ lạnh">❄️ Tủ Lạnh</th>
                      <th className="py-3 px-2 text-center" title="Máy giặt">🧺 Giặt</th>
                      <th className="py-3 px-2 text-center" title="Máy sấy">♨️ Sấy</th>
                      <th className="py-3 px-2 text-center" title="Máy rửa bát">🍽️ Rửa Bát</th>
                      <th className="py-3 px-3">Ngày gửi</th>
                      <th className="py-3 px-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDemands.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="py-10 text-center text-gray-500 font-medium">
                          {search
                            ? `Không tìm thấy cư dân nào khớp với từ khóa "${search}"`
                            : 'Chưa có bản ghi khảo sát nào'}
                        </td>
                      </tr>
                    ) : (
                      filteredDemands.map((record, index) => (
                        <tr
                          key={record.id}
                          className="hover:bg-gray-50/80 transition-colors font-medium"
                        >
                          <td className="py-3 px-3 text-gray-500">{index + 1}</td>
                          <td className="py-3 px-3 font-bold text-gray-900">
                            {record.zalo_name}
                          </td>
                          <td className="py-3 px-3 font-black text-kyoto-900 bg-kyoto-50/40">
                            {record.apartment_number}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-900 bg-emerald-50/30 tracking-wide">
                            {record.phone_number ? (
                              <span>{record.phone_number}</span>
                            ) : (
                              <span className="text-gray-400 font-normal italic">Chưa cập nhật</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.tv_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.tv_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.sofa_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.sofa_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.curtain_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.curtain_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.drying_rack_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.drying_rack_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.bed_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.bed_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.dining_table_set_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.dining_table_set_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.refrigerator_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.refrigerator_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.washing_machine_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.washing_machine_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.dryer_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.dryer_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.dishwasher_qty > 0 ? (
                              <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-1.5 py-0.5 rounded border border-kyoto-200">
                                {record.dishwasher_qty}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-gray-500 whitespace-nowrap">
                            {formatDateTimeVietnam(record.created_at)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setEditingRecord(record)}
                                className="p-1.5 rounded-lg text-kyoto-800 hover:bg-kyoto-100 transition-colors"
                                title="Chỉnh sửa bản ghi"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(
                                    record.id,
                                    record.zalo_name,
                                    record.apartment_number
                                  )
                                }
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa bản ghi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-kyoto-800" />
                <span>Chỉnh sửa khảo sát cư dân</span>
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên Zalo
                  </label>
                  <input
                    type="text"
                    value={editingRecord.zalo_name}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, zalo_name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Số căn hộ
                  </label>
                  <input
                    type="text"
                    value={editingRecord.apartment_number}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        apartment_number: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-black uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editingRecord.phone_number || ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        phone_number: e.target.value,
                      })
                    }
                    placeholder="0912345678"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Số lượng từng món đồ:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRODUCTS.map((p) => (
                    <div
                      key={p.key}
                      className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-xs"
                    >
                      <div className="font-bold text-gray-800 truncate mb-1">
                        {p.icon} {p.name}
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={(editingRecord as any)[p.dbField] || 0}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            [p.dbField]: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-gray-300 bg-white text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={editingRecord.note || ''}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, note: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-kyoto-800 hover:bg-kyoto-900 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
