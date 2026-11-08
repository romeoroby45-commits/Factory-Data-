import React, { useState } from 'react';
import {
  Hammer,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { ToolItem } from '../types';
import {
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
} from '../utils/helpers';
import { ConfirmModal } from '../components/ConfirmModal';

const TOOL_CONDITIONS: Record<
  ToolItem['condition'],
  { label: string; color: string; bg: string; border: string }
> = {
  good: {
    label: 'حالة ممتازة / جديدة',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-900/60',
  },
  fair: {
    label: 'حالة جيدة / مستعملة',
    color: 'text-[#007BFF]',
    bg: 'bg-blue-950/40',
    border: 'border-blue-900/60',
  },
  needs_repair: {
    label: 'تحتاج لصيانة / تصليح',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-900/60',
  },
  damaged: {
    label: 'تالفة / مفقودة',
    color: 'text-red-400',
    bg: 'bg-red-950/40',
    border: 'border-red-900/60',
  },
};

export const ToolsView: React.FC = () => {
  const { tools, addTool, updateTool, deleteTool, settings } = useFactory();

  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    quantity: number;
    unitPrice: number;
    purchaseDate: string;
    condition: ToolItem['condition'];
    location: string;
    notes: string;
  }>({
    name: '',
    quantity: 1,
    unitPrice: 200,
    purchaseDate: getTodayDateString(),
    condition: 'good',
    location: 'صندوق أدوات الورشة 1',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingTool(null);
    setFormData({
      name: '',
      quantity: 5,
      unitPrice: 150,
      purchaseDate: getTodayDateString(),
      condition: 'good',
      location: 'صندوق أدوات الورشة 1',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: ToolItem) => {
    setEditingTool(t);
    setFormData({
      name: t.name,
      quantity: t.quantity,
      unitPrice: t.unitPrice,
      purchaseDate: t.purchaseDate,
      condition: t.condition,
      location: t.location,
      notes: t.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const qty = Number(formData.quantity) || 1;
    const price = Number(formData.unitPrice) || 0;
    const totalVal = qty * price;

    if (editingTool) {
      await updateTool({
        ...editingTool,
        name: formData.name.trim(),
        quantity: qty,
        unitPrice: price,
        totalValue: totalVal,
        purchaseDate: formData.purchaseDate,
        condition: formData.condition,
        location: formData.location.trim(),
        notes: formData.notes.trim() || undefined,
      });
    } else {
      const newT: ToolItem = {
        id: generateId(),
        name: formData.name.trim(),
        quantity: qty,
        unitPrice: price,
        totalValue: totalVal,
        purchaseDate: formData.purchaseDate,
        condition: formData.condition,
        location: formData.location.trim(),
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await addTool(newT);
    }
    setIsModalOpen(false);
  };

  const filteredTools = tools.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCondition = conditionFilter === 'ALL' || t.condition === conditionFilter;
    return matchSearch && matchCondition;
  });

  const totalToolsVal = tools.reduce((acc, t) => acc + (t.totalValue || t.quantity * t.unitPrice), 0);
  const totalToolsCount = tools.reduce((acc, t) => acc + t.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Hammer className="w-5 h-5 text-[#007BFF]" />
            إدارة المستلزمات والأدوات اليدوية
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            حصر العدد والأدوات الصناعية، أماكن تواجدها، وحالاتها التشغيلية داخل أقسام المصنع
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة أداة جديدة
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي قيمة الأدوات والمستلزمات</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {formatCurrency(totalToolsVal, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">{tools.length} بند مسجل</span>
        </div>

        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي عدد القطع المتوفرة</span>
          <span className="text-xl font-bold text-[#007BFF] tabular-nums">
            {totalToolsCount} قطعة أداة
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">موزعة على العنابر والورش</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#666666]" />
          <input
            type="text"
            placeholder="بحث بالأداة أو موقعها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8 pl-3 py-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF] w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#B0B0B0]">تصفية الحالة:</span>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="good">ممتازة</option>
            <option value="fair">جيدة</option>
            <option value="needs_repair">تحتاج تصليح</option>
            <option value="damaged">تالفة</option>
          </select>
        </div>
      </div>

      {/* Tools Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs table-dark">
            <thead>
              <tr>
                <th className="p-3.5">اسم الأداة</th>
                <th className="p-3.5">العدد</th>
                <th className="p-3.5">سعر الوحدة</th>
                <th className="p-3.5">إجمالي القيمة</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">مكان التواجد</th>
                <th className="p-3.5">تاريخ الشراء</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#666666]">
                    لا توجد أدوات مسجلة حالياً. اضغط "إضافة أداة جديدة" للبدء.
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => {
                  const cond = TOOL_CONDITIONS[tool.condition] || TOOL_CONDITIONS.good;
                  return (
                    <tr key={tool.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {tool.name}
                        {tool.notes && (
                          <span className="block text-[10px] text-[#888888] font-normal">
                            {tool.notes}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-white tabular-nums whitespace-nowrap">
                        {tool.quantity} قطعة
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                        {formatCurrency(tool.unitPrice, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 font-bold text-white tabular-nums whitespace-nowrap">
                        {formatCurrency(
                          tool.totalValue || tool.quantity * tool.unitPrice,
                          settings.currencySymbol
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${cond.bg} ${cond.color} ${cond.border}`}
                        >
                          {cond.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{tool.location}</td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(tool.purchaseDate)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tool)}
                            className="p-1.5 text-[#007BFF] hover:bg-[#1a2536] rounded-md transition-colors"
                            title="تعديل الأداة"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(tool.id)}
                            className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                            title="حذف الأداة"
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

      {/* Add / Edit Tool Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white">
                {editingTool ? 'تعديل بيانات الأداة' : 'إضافة أداة أو مستلزم جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم الأداة <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شنيور كهربائي 800 واط / مفتاح عزم / طقم لقم"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">العدد</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    سعر الوحدة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    حالة الأداة
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="good">ممتازة</option>
                    <option value="fair">جيدة</option>
                    <option value="needs_repair">تحتاج تصليح</option>
                    <option value="damaged">تالفة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    مكان التواجد
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ورشة الصيانة - دولاب 2"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  تاريخ الشراء
                </label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  {editingTool ? 'تحديث الأداة' : 'حفظ الأداة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteTool(deleteConfirmId);
        }}
        title="تأكيد حذف الأداة"
        message="هل أنت متأكد من حذف هذه الأداة من السجلات؟"
      />
    </div>
  );
};
