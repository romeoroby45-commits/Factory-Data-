import React, { useState } from 'react';
import {
  Cog,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowRight,
  Layers,
  Calendar,
  DollarSign,
  AlertCircle,
  PackageCheck,
  X,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { WorkInProgressItem, WIPStatus } from '../types';
import {
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
} from '../utils/helpers';
import { ConfirmModal } from '../components/ConfirmModal';

const WIP_STATUS_CONFIG: Record<
  WIPStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  in_progress: {
    label: 'تحت التشغيل',
    color: 'text-[#007BFF]',
    bg: 'bg-blue-950/40',
    border: 'border-blue-900/60',
  },
  under_manufacturing: {
    label: 'قيد التصنيع الفعلي',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-900/60',
  },
  completed: {
    label: 'مكتمل التصنيع',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-900/60',
  },
  paused: {
    label: 'متوقف مؤقتاً',
    color: 'text-zinc-400',
    bg: 'bg-zinc-900',
    border: 'border-zinc-800',
  },
};

export const WorkInProgressView: React.FC = () => {
  const {
    workInProgress,
    addWorkInProgress,
    updateWorkInProgress,
    deleteWorkInProgress,
    convertToFinishedProduct,
    settings,
  } = useFactory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkInProgressItem | null>(null);

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingItem, setConvertingItem] = useState<WorkInProgressItem | null>(null);
  const [sellingPriceInput, setSellingPriceInput] = useState<number>(100);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    requiredQty: number;
    completedQty: number;
    rawMaterialsUsed: string;
    suppliesUsed: string;
    productionCost: number;
    startDate: string;
    expectedEndDate: string;
    status: WIPStatus;
    notes: string;
  }>({
    name: '',
    code: '',
    requiredQty: 100,
    completedQty: 0,
    rawMaterialsUsed: '',
    suppliesUsed: '',
    productionCost: 5000,
    startDate: getTodayDateString(),
    expectedEndDate: getTodayDateString(),
    status: 'in_progress',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: `WIP-${Math.floor(1000 + Math.random() * 9000)}`,
      requiredQty: 100,
      completedQty: 0,
      rawMaterialsUsed: 'خامات بولي إيثيلين - صبغة زرقاء',
      suppliesUsed: 'عبوات كرتونية - أشرطة لاصقة',
      productionCost: 5000,
      startDate: getTodayDateString(),
      expectedEndDate: getTodayDateString(),
      status: 'in_progress',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WorkInProgressItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      requiredQty: item.requiredQty,
      completedQty: item.completedQty,
      rawMaterialsUsed: item.rawMaterialsUsed || '',
      suppliesUsed: item.suppliesUsed || '',
      productionCost: item.productionCost,
      startDate: item.startDate,
      expectedEndDate: item.expectedEndDate,
      status: item.status,
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      await updateWorkInProgress({
        ...editingItem,
        name: formData.name.trim(),
        code: formData.code.trim(),
        requiredQty: Number(formData.requiredQty) || 0,
        completedQty: Number(formData.completedQty) || 0,
        rawMaterialsUsed: formData.rawMaterialsUsed.trim(),
        suppliesUsed: formData.suppliesUsed.trim(),
        productionCost: Number(formData.productionCost) || 0,
        startDate: formData.startDate,
        expectedEndDate: formData.expectedEndDate,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });
    } else {
      const newItem: WorkInProgressItem = {
        id: generateId(),
        name: formData.name.trim(),
        code: formData.code.trim(),
        requiredQty: Number(formData.requiredQty) || 0,
        completedQty: Number(formData.completedQty) || 0,
        rawMaterialsUsed: formData.rawMaterialsUsed.trim(),
        suppliesUsed: formData.suppliesUsed.trim(),
        productionCost: Number(formData.productionCost) || 0,
        startDate: formData.startDate,
        expectedEndDate: formData.expectedEndDate,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await addWorkInProgress(newItem);
    }
    setIsModalOpen(false);
  };

  // Open Convert Modal
  const handleOpenConvert = (item: WorkInProgressItem) => {
    setConvertingItem(item);
    // Estimated selling price default (cost / qty * 1.4)
    const unitCost =
      item.productionCost / (item.completedQty > 0 ? item.completedQty : item.requiredQty || 1);
    setSellingPriceInput(Math.round(unitCost * 1.35) || 100);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = async () => {
    if (!convertingItem) return;
    await convertToFinishedProduct(convertingItem.id, sellingPriceInput);
    setIsConvertModalOpen(false);
    alert('تم تحويل أمر التصنيع بنجاح إلى قسم المنتجات التامة!');
  };

  const filteredWip = workInProgress.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Cog className="w-5 h-5 text-[#007BFF]" />
            إدارة المنتجات تحت التشغيل (WIP)
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            متابعة أوامر التصنيع، الخامات المستهلكة، تكاليف الإنتاج، والتحويل للمنتجات التامة
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة أمر تصنيع جديد
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#666666]" />
          <input
            type="text"
            placeholder="بحث باسم المنتج أو الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8 pl-3 py-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF] w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#B0B0B0]">تصفية الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="in_progress">تحت التشغيل</option>
            <option value="under_manufacturing">قيد التصنيع</option>
            <option value="completed">مكتمل</option>
            <option value="paused">متوقف</option>
          </select>
        </div>
      </div>

      {/* WIP Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs table-dark">
            <thead>
              <tr>
                <th className="p-3.5">اسم المنتج</th>
                <th className="p-3.5">الكود</th>
                <th className="p-3.5">الكمية المطلوبة</th>
                <th className="p-3.5">المنجز منها</th>
                <th className="p-3.5">نسبة الإنجاز</th>
                <th className="p-3.5">تكلفة الإنتاج</th>
                <th className="p-3.5">المواد والمستلزمات</th>
                <th className="p-3.5">تاريخ الانتهاء</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {filteredWip.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-[#666666]">
                    لا توجد منتجات تحت التشغيل حالياً. اضغط "إضافة أمر تصنيع جديد" للبدء.
                  </td>
                </tr>
              ) : (
                filteredWip.map((wip) => {
                  const percent =
                    wip.requiredQty > 0
                      ? Math.min(100, Math.round((wip.completedQty / wip.requiredQty) * 100))
                      : 0;
                  const statusInfo = WIP_STATUS_CONFIG[wip.status] || WIP_STATUS_CONFIG.in_progress;

                  return (
                    <tr key={wip.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">{wip.name}</td>
                      <td className="p-3.5 text-[#007BFF] font-mono tabular-nums whitespace-nowrap">
                        {wip.code}
                      </td>
                      <td className="p-3.5 text-white tabular-nums whitespace-nowrap">
                        {wip.requiredQty}
                      </td>
                      <td className="p-3.5 text-emerald-400 font-bold tabular-nums whitespace-nowrap">
                        {wip.completedQty}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#007BFF] rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#B0B0B0] tabular-nums font-bold">
                            {percent}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-white tabular-nums whitespace-nowrap font-bold">
                        {formatCurrency(wip.productionCost, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] max-w-xs truncate">
                        {wip.rawMaterialsUsed || '-'}
                      </td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(wip.expectedEndDate)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* One-click convert to finished product */}
                          {wip.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleOpenConvert(wip)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-md transition-colors flex items-center gap-1"
                              title="تحويل إلى المنتجات التامة"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              تحويل لتام
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(wip)}
                            className="p-1.5 text-[#007BFF] hover:bg-[#1a2536] rounded-md transition-colors"
                            title="تعديل أمر التصنيع"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(wip.id)}
                            className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                            title="حذف أمر التصنيع"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit WIP Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'تعديل أمر التشغيل' : 'إضافة أمر تصنيع وتشغيل جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم المنتج تحت التشغيل <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: طقم كراسي مكتب موديل إكس / عبوات بلاستيك 1 لتر"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    كود المنتج
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    الكمية المطلوبة
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.requiredQty}
                    onChange={(e) =>
                      setFormData({ ...formData, requiredQty: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    الكمية المنجزة
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.completedQty}
                    onChange={(e) =>
                      setFormData({ ...formData, completedQty: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تكلفة الإنتاج الإجمالية ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.productionCost}
                    onChange={(e) =>
                      setFormData({ ...formData, productionCost: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as WIPStatus })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="in_progress">تحت التشغيل</option>
                    <option value="under_manufacturing">قيد التصنيع</option>
                    <option value="completed">مكتمل</option>
                    <option value="paused">متوقف</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  المواد الخام المستخدمة
                </label>
                <input
                  type="text"
                  placeholder="مثال: 50 كجم حبيبات بلاستيك، 5 لتر دهان أزرق"
                  value={formData.rawMaterialsUsed}
                  onChange={(e) =>
                    setFormData({ ...formData, rawMaterialsUsed: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  المستلزمات المستخدمة
                </label>
                <input
                  type="text"
                  placeholder="مثال: مسامير، كراتين تعبئة، ملصقات باركود"
                  value={formData.suppliesUsed}
                  onChange={(e) => setFormData({ ...formData, suppliesUsed: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ بدء التصنيع
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ الانتهاء المتوقع
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expectedEndDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedEndDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  {editingItem ? 'تحديث أمر التشغيل' : 'حفظ أمر التشغيل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Finished Product Modal */}
      {isConvertModalOpen && convertingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              تحويل أمر التشغيل إلى المنتجات التامة
            </h3>
            <p className="text-xs text-[#B0B0B0] mb-4 leading-relaxed">
              سيتم نقل المنتج <span className="text-white font-bold">{convertingItem.name}</span> إلى
              قسم المنتجات التامة وتحديث حالته تلقائياً ليصبح متاحاً للبيع والتسليم.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs bg-[#0a0a0a] p-2.5 rounded border border-[#222222]">
                <span className="text-[#888888]">الكمية المنجزة:</span>
                <span className="font-bold text-white tabular-nums">
                  {convertingItem.completedQty > 0
                    ? convertingItem.completedQty
                    : convertingItem.requiredQty}{' '}
                  قطعة
                </span>
              </div>

              <div className="flex justify-between text-xs bg-[#0a0a0a] p-2.5 rounded border border-[#222222]">
                <span className="text-[#888888]">تكلفة التصنيع الإجمالية:</span>
                <span className="font-bold text-white tabular-nums">
                  {formatCurrency(convertingItem.productionCost, settings.currencySymbol)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  حدد سعر بيع الوحدة المقترح ({settings.currencySymbol}):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={sellingPriceInput}
                  onChange={(e) => setSellingPriceInput(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-lg shadow-sm"
              >
                تأكيد التحويل الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteWorkInProgress(deleteConfirmId);
        }}
        title="تأكيد حذف أمر التشغيل"
        message="هل أنت متأكد من حذف هذا الأمر من سجلات التشغيل؟"
      />
    </div>
  );
};
