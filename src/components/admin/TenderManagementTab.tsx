'use client';

import React, { useState, useEffect } from 'react';
import { SupplierTender, SupplierTenderItem, TenderStatus } from '@/types/supplier';
import { ProductKey } from '@/types/demand';
import { PRODUCTS } from '@/lib/constants';
import QuickModelEntryBox from './QuickModelEntryBox';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  FolderPlus,
  CheckCircle2,
  Lock,
  Archive,
  Eye,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Share2,
  Sparkles,
  Layers,
  Wrench,
  Check,
} from 'lucide-react';

interface TenderManagementTabProps {
  communityDemandMap: Record<ProductKey, number>;
}

export default function TenderManagementTab({
  communityDemandMap,
}: TenderManagementTabProps) {
  const [tenders, setTenders] = useState<SupplierTender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [items, setItems] = useState<SupplierTenderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Tender Modal state
  const [showNewTenderModal, setShowNewTenderModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Đợt #02 – Rèm cửa • Lưới an toàn • Giàn phơi cư dân Kyoto');
  const [newDesc, setNewDesc] = useState('Cộng đồng cư dân Kyoto mời các đơn vị tại Thanh Hóa tham gia chào giá các hạng mục rèm cửa, lưới an toàn và giàn phơi. Giá ưu tiên theo phương án hoàn thiện, minh bạch vật tư, lắp đặt và bảo hành.');
  const [isCreatingTender, setIsCreatingTender] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Cloned item for Quick Entry Box
  const [clonedItem, setClonedItem] = useState<Partial<SupplierTenderItem> | null>(null);

  // Edit Item Modal
  const [editingItem, setEditingItem] = useState<SupplierTenderItem | null>(null);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tenders');
      const json = await res.json();
      if (json.success && json.data) {
        setTenders(json.data);
        if (json.data.length > 0 && !selectedTenderId) {
          setSelectedTenderId(json.data[0].id);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải danh sách đợt chào giá');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (tenderId: string) => {
    if (!tenderId) return;
    try {
      const res = await fetch(`/api/admin/tenders/${tenderId}/items`);
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data);
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  useEffect(() => {
    if (selectedTenderId) {
      fetchItems(selectedTenderId);
    }
  }, [selectedTenderId]);

  const selectedTender = tenders.find((t) => t.id === selectedTenderId);

  // Create Tender handler
  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreatingTender(true);
    try {
      const res = await fetch('/api/admin/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          status: 'draft',
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setShowNewTenderModal(false);
        setTenders([json.data, ...tenders]);
        setSelectedTenderId(json.data.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tạo đợt');
    } finally {
      setIsCreatingTender(false);
    }
  };

  // Seed 7 standard items for Round #02
  const handleSeedTender02 = async () => {
    if (!selectedTenderId) return;
    if (!confirm('Nạp 7 hạng mục chuẩn cho Đợt #02 (5 loại rèm, Lưới an toàn, Giàn phơi)?')) return;

    setIsSeeding(true);
    try {
      const standardItems = [
        {
          category_key: 'curtain',
          brand: 'Rèm Cửa',
          model_code: 'REM-1-LOP',
          product_name: 'Rèm vải 1 lớp',
          item_type: 'SERVICE_SPEC',
          unit: 'm²',
          reference_qty: 100,
          specifications: 'Vải cản sáng 1 lớp, may hoàn thiện, thanh ray, phụ kiện, đo đạc và lắp đặt trọn gói',
          display_order: 1,
        },
        {
          category_key: 'curtain',
          brand: 'Rèm Cửa',
          model_code: 'REM-2-LOP',
          product_name: 'Rèm vải 2 lớp (Vải chính + Voan)',
          item_type: 'SERVICE_SPEC',
          unit: 'm²',
          reference_qty: 150,
          specifications: 'Vải chính + lớp voan may hoàn thiện, ray đôi, phụ kiện, đo đạc, lắp đặt trọn gói',
          display_order: 2,
        },
        {
          category_key: 'curtain',
          brand: 'Rèm Cửa',
          model_code: 'REM-CAU-VONG',
          product_name: 'Rèm cầu vồng Hàn Quốc',
          item_type: 'SERVICE_SPEC',
          unit: 'm²',
          reference_qty: 80,
          specifications: 'Rèm cầu vồng, chào theo giá trực tiếp hoặc chiết khấu % theo catalog',
          display_order: 3,
        },
        {
          category_key: 'curtain',
          brand: 'Rèm Cửa',
          model_code: 'REM-CUON',
          product_name: 'Rèm cuốn chống nắng',
          item_type: 'SERVICE_SPEC',
          unit: 'm²',
          reference_qty: 50,
          specifications: 'Rèm cuốn cản sáng văn phòng / phòng ngủ',
          display_order: 4,
        },
        {
          category_key: 'curtain',
          brand: 'Rèm Cửa',
          model_code: 'REM-TO-ONG',
          product_name: 'Rèm tổ ong cách nhiệt',
          item_type: 'SERVICE_SPEC',
          unit: 'm²',
          reference_qty: 30,
          specifications: 'Rèm tổ ong ngăn nhiệt điều hòa, ray và lắp đặt',
          display_order: 5,
        },
        {
          category_key: 'safety_net',
          brand: 'Lưới An Toàn',
          model_code: 'LUOI-AT-BAN-CONG',
          product_name: 'Lưới an toàn ban công / Cửa sổ',
          item_type: 'SERVICE_SPEC',
          unit: 'm²',
          reference_qty: 120,
          specifications: 'Cáp inox 304 bọc nhựa / trần, thanh nhôm định hình dập vít nở, đo đạc và thi công trọn gói',
          display_order: 6,
        },
        {
          category_key: 'drying_rack',
          brand: 'Hòa Phát / Sankaku',
          model_code: 'GP-QUAY-TAY',
          product_name: 'Giàn phơi thông minh gắn trần tay quay liền',
          item_type: 'PRODUCT_MODEL',
          unit: 'bộ',
          reference_qty: 40,
          specifications: 'Bộ giàn phơi 2 thanh phơi nhôm 2.2m, dây cáp lụa inox, củ quay trợ lực, trọn gói lắp đặt',
          display_order: 7,
        },
      ];

      for (const it of standardItems) {
        await fetch(`/api/admin/tenders/${selectedTenderId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(it),
        });
      }

      fetchItems(selectedTenderId);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Change Tender Status handler (Draft -> Open -> Closed -> Archived)
  const handleStatusChange = async (newStatus: TenderStatus) => {
    if (!selectedTenderId) return;
    try {
      const res = await fetch(`/api/admin/tenders/${selectedTenderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTenders(tenders.map((t) => (t.id === selectedTenderId ? json.data : t)));
      }
    } catch (err: any) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  };

  // Delete Tender Item handler
  const handleDeleteItem = async (itemId: string, brand: string, model: string) => {
    if (!confirm(`Bạn có chắc muốn xóa hạng mục "${brand} ${model}" khỏi đợt này?`)) return;
    try {
      const res = await fetch(`/api/admin/tenders/items/${itemId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setItems(items.filter((i) => i.id !== itemId));
      }
    } catch (err: any) {
      alert('Lỗi xóa item: ' + err.message);
    }
  };

  // Clone item to Quick Entry Box
  const handleCloneItem = (item: SupplierTenderItem) => {
    setClonedItem({
      category_key: item.category_key,
      item_type: item.item_type,
      unit: item.unit,
      brand: item.brand,
      model_code: `${item.model_code}-COPY`,
      reference_qty: item.reference_qty,
      product_name: item.product_name,
      specifications: item.specifications,
    });
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Save item edits
  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/admin/tenders/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setItems(items.map((i) => (i.id === editingItem.id ? json.data : i)));
        setEditingItem(null);
      }
    } catch (err: any) {
      alert('Lỗi lưu thay đổi: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tender Selector & Top Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tender Switcher */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
            Đợt chào giá:
          </label>
          <select
            value={selectedTenderId}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kyoto-700"
          >
            {tenders.length === 0 ? (
              <option value="">Chưa có đợt nào</option>
            ) : (
              tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} [{t.status.toUpperCase()}] ({t.items_count || 0} hạng mục)
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={() => setShowNewTenderModal(true)}
            className="px-4 py-2.5 rounded-xl bg-kyoto-800 hover:bg-kyoto-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap"
          >
            <FolderPlus className="w-4 h-4 text-champagne-300" />
            <span>+ Tạo Đợt Mới</span>
          </button>
        </div>

        {/* Right: Status Switcher for Selected Tender */}
        {selectedTender && (
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl self-start md:self-auto">
            <span className="text-xs font-semibold text-gray-500 px-2">Trạng thái:</span>
            {(['draft', 'open', 'closed', 'archived'] as TenderStatus[]).map((st) => {
              const isCurrent = selectedTender.status === st;
              const labels: Record<TenderStatus, string> = {
                draft: 'Nháp',
                open: 'Đang Mở Nhận Giá',
                closed: 'Đã Đóng',
                archived: 'Lưu Trữ',
              };
              const colors: Record<TenderStatus, string> = {
                draft: 'bg-gray-700 text-white',
                open: 'bg-emerald-600 text-white font-black shadow-sm ring-1 ring-emerald-400',
                closed: 'bg-amber-600 text-white',
                archived: 'bg-gray-500 text-white',
              };

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? colors[st]
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {labels[st]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Model Entry Box (Always available on selected tender) */}
      {selectedTender && (
        <QuickModelEntryBox
          tenderId={selectedTender.id}
          communityDemandMap={communityDemandMap}
          existingItems={items}
          onItemAdded={(newItem) => setItems([...items, newItem])}
          clonedItem={clonedItem}
          onClearCloned={() => setClonedItem(null)}
        />
      )}

      {/* Model Items Table for Selected Tender */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-kyoto-800" />
            <span>Danh sách Hạng Mục / Model mời chào giá ({items.length} mục)</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedTender && items.length === 0 && (
              <button
                type="button"
                onClick={handleSeedTender02}
                disabled={isSeeding}
                className="text-xs font-bold text-kyoto-900 bg-champagne-100 hover:bg-champagne-200 px-3 py-1.5 rounded-lg border border-champagne-300 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSeeding ? 'Đang nạp mẫu...' : '⚡ Nạp 7 mục chuẩn Đợt #02'}</span>
              </button>
            )}

            {selectedTender?.status === 'open' && (
              <a
                href="/nha-cung-cap"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-kyoto-800 hover:text-kyoto-950 flex items-center gap-1 bg-kyoto-50 px-2.5 py-1.5 rounded-lg border border-kyoto-200"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trang chào giá NCC ↗</span>
              </a>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">STT</th>
                <th className="py-3 px-3">Nhóm</th>
                <th className="py-3 px-3">Loại</th>
                <th className="py-3 px-3">Thương hiệu / Nhóm</th>
                <th className="py-3 px-3">Mã Model / Quy cách</th>
                <th className="py-3 px-3">Tên & Mô tả thi công</th>
                <th className="py-3 px-3 text-center">Nhu cầu tham khảo</th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                    Chưa có hạng mục nào trong đợt này. Hãy dùng form bên trên hoặc bấm &quot;Nạp 7 mục chuẩn Đợt #02&quot;!
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const pConfig = PRODUCTS.find((p) => p.key === it.category_key);
                  const isService = it.item_type === 'SERVICE_SPEC';

                  return (
                    <tr key={it.id} className="hover:bg-gray-50/80 transition-colors font-medium">
                      <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900 whitespace-nowrap">
                        <span>{it.category_key === 'safety_net' ? '🛡️' : pConfig?.icon || '📦'} </span>
                        <span>
                          {it.category_key === 'safety_net'
                            ? 'Lưới An Toàn'
                            : it.category_key === 'curtain'
                            ? 'Rèm Cửa'
                            : pConfig?.name || it.category_key}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isService
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}
                        >
                          {isService ? 'Thi công quy cách' : 'Model sản phẩm'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-800">{it.brand}</td>
                      <td className="py-3 px-3 font-black text-kyoto-900 tracking-wide text-xs font-mono">
                        {it.model_code}
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-xs truncate">
                        {it.product_name ? <div className="font-semibold text-gray-900">{it.product_name}</div> : null}
                        {it.specifications ? (
                          <div className="text-[11px] text-gray-500">{it.specifications}</div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-extrabold text-kyoto-900 bg-kyoto-50 px-2 py-0.5 rounded border border-kyoto-200">
                          {it.reference_qty} {it.unit || pConfig?.unit || 'bộ'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Clone Button */}
                          <button
                            type="button"
                            onClick={() => handleCloneItem(it)}
                            title="Nhân bản hạng mục này"
                            className="p-1.5 rounded-lg text-champagne-700 bg-champagne-50 hover:bg-champagne-100 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingItem(it)}
                            title="Sửa thông tin"
                            className="p-1.5 rounded-lg text-kyoto-800 hover:bg-kyoto-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(it.id, it.brand, it.model_code)}
                            title="Xóa hạng mục"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Tender */}
      {showNewTenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-kyoto-800" />
              <span>Tạo Đợt Mời Chào Giá Mới</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Khởi tạo đợt mới để mời các nhà phân phối gửi báo giá theo từng giai đoạn
            </p>

            <form onSubmit={handleCreateTender} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tiêu đề đợt chào giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="VD: Đợt #02 – Rèm cửa • Lưới an toàn • Giàn phơi cư dân Kyoto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kyoto-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mô tả / Lời nhắn gửi tới Nhà cung cấp
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-kyoto-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTenderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTender}
                  className="px-5 py-2.5 rounded-xl bg-kyoto-800 hover:bg-kyoto-900 text-white font-bold text-xs shadow-md"
                >
                  {isCreatingTender ? 'Đang tạo...' : 'Tạo Đợt Chào Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Single Tender Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-kyoto-800" />
              <span>Chỉnh Sửa Hạng Mục</span>
            </h3>

            <form onSubmit={handleSaveItemEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Loại hạng mục</label>
                  <select
                    value={editingItem.item_type || 'PRODUCT_MODEL'}
                    onChange={(e) => setEditingItem({ ...editingItem, item_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                  >
                    <option value="SERVICE_SPEC">Thi công quy cách</option>
                    <option value="PRODUCT_MODEL">Sản phẩm Model</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={editingItem.unit || 'bộ'}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Thương hiệu / Nhóm</label>
                  <input
                    type="text"
                    value={editingItem.brand}
                    onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mã Model / Quy cách</label>
                  <input
                    type="text"
                    value={editingItem.model_code}
                    onChange={(e) => setEditingItem({ ...editingItem, model_code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-black uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nhu cầu tham khảo</label>
                  <input
                    type="number"
                    min={1}
                    value={editingItem.reference_qty}
                    onChange={(e) => setEditingItem({ ...editingItem, reference_qty: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên hiển thị đầy đủ</label>
                  <input
                    type="text"
                    value={editingItem.product_name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, product_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Thông số / Mô tả thi công</label>
                <textarea
                  value={editingItem.specifications || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, specifications: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-kyoto-800 hover:bg-kyoto-900 text-white font-bold text-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
