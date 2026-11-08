import React, { useState, useMemo } from 'react';
import {
  Boxes,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  History,
  TrendingDown,
  Layers,
  X,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { InventoryItem, InventoryMovement, InventoryStandardCategory } from '../types';
import {
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
  fileToBase64,
} from '../utils/helpers';
import { ConfirmModal } from '../components/ConfirmModal';

const CORE_CATEGORIES: InventoryStandardCategory[] = [
  'الخامات',
  'المستلزمات',
  'الإكسسوارات',
  'الدهانات',
  'التشطيبات',
  'المنتجات تحت التشغيل',
  'المنتجات التامة',
  'الأدوات',
];

const COMMON_UNITS = ['قطعة', 'كجم', 'طن', 'متر', 'لتر', 'علبة', 'دستة', 'بكرة', 'كرتونة'];

export const InventoryView: React.FC = () => {
  const {
    inventory,
    movements,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    recordInventoryMovement,
    settings,
    updateSettings,
  } = useFactory();

  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<InventoryItem | null>(null);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Item Form State
  const [itemForm, setItemForm] = useState<{
    name: string;
    code: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    supplier: string;
    minAlertQty: number;
    location: string;
    notes: string;
    imageUrl?: string;
  }>({
    name: '',
    code: '',
    category: 'الخامات',
    quantity: 100,
    unit: 'كجم',
    unitPrice: 50,
    supplier: '',
    minAlertQty: 10,
    location: 'عنبر التخزين أ',
    notes: '',
    imageUrl: '',
  });

  // Movement Form State
  const [movementForm, setMovementForm] = useState<{
    itemId: string;
    type: 'IN' | 'OUT' | 'WASTE';
    quantity: number;
    reason: string;
    responsible: string;
    notes: string;
  }>({
    itemId: '',
    type: 'OUT',
    quantity: 10,
    reason: 'صرف لخط الإنتاج',
    responsible: 'أمين المخزن',
    notes: '',
  });

  // All combined categories (core + custom)
  const allCategories = useMemo(() => {
    return [...CORE_CATEGORIES, ...(settings.customCategories || [])];
  }, [settings.customCategories]);

  // Open Add Item
  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      code: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: allCategories[0] || 'الخامات',
      quantity: 50,
      unit: 'قطعة',
      unitPrice: 100,
      supplier: 'شركة التوريدات الرئيسية',
      minAlertQty: 10,
      location: 'مستودع الخامات الرئيسي',
      notes: '',
      imageUrl: '',
    });
    setIsItemModalOpen(true);
  };

  // Open Edit Item
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      code: item.code,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      supplier: item.supplier || '',
      minAlertQty: item.minAlertQty || 0,
      location: item.location,
      notes: item.notes || '',
      imageUrl: item.imageUrl || '',
    });
    setIsItemModalOpen(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;

    const totalVal = (Number(itemForm.quantity) || 0) * (Number(itemForm.unitPrice) || 0);

    if (editingItem) {
      await updateInventoryItem({
        ...editingItem,
        name: itemForm.name.trim(),
        code: itemForm.code.trim(),
        category: itemForm.category,
        quantity: Number(itemForm.quantity) || 0,
        unit: itemForm.unit,
        unitPrice: Number(itemForm.unitPrice) || 0,
        totalValue: totalVal,
        supplier: itemForm.supplier.trim() || undefined,
        minAlertQty: Number(itemForm.minAlertQty) || 0,
        location: itemForm.location.trim(),
        notes: itemForm.notes.trim() || undefined,
        imageUrl: itemForm.imageUrl,
      });
    } else {
      const newItem: InventoryItem = {
        id: generateId(),
        name: itemForm.name.trim(),
        code: itemForm.code.trim(),
        category: itemForm.category,
        quantity: Number(itemForm.quantity) || 0,
        unit: itemForm.unit,
        unitPrice: Number(itemForm.unitPrice) || 0,
        totalValue: totalVal,
        supplier: itemForm.supplier.trim() || undefined,
        minAlertQty: Number(itemForm.minAlertQty) || 0,
        location: itemForm.location.trim(),
        notes: itemForm.notes.trim() || undefined,
        imageUrl: itemForm.imageUrl,
        createdAt: new Date().toISOString(),
      };
      await addInventoryItem(newItem);
    }

    setIsItemModalOpen(false);
  };

  // Open Movement Modal
  const handleOpenMovement = (item: InventoryItem, defaultType: 'IN' | 'OUT' | 'WASTE' = 'OUT') => {
    setSelectedItemForMovement(item);
    setMovementForm({
      itemId: item.id,
      type: defaultType,
      quantity: defaultType === 'OUT' ? 5 : 20,
      reason:
        defaultType === 'IN'
          ? 'توريد بضاعة جديدة للمخزن'
          : defaultType === 'WASTE'
          ? 'هالك وتلف أثناء التصنيع'
          : 'صرف للأقسام وعنابر التشغيل',
      responsible: 'مسؤول المخزن',
      notes: '',
    });
    setIsMovementModalOpen(true);
  };

  // Save Movement
  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMovement) return;

    const qty = Number(movementForm.quantity) || 0;
    if (qty <= 0) {
      alert('يرجى إدخال كمية صحيحة');
      return;
    }

    if (movementForm.type !== 'IN' && qty > selectedItemForMovement.quantity) {
      alert(
        `الكمية المتاحة في المخزن حالياً هي ${selectedItemForMovement.quantity} ${selectedItemForMovement.unit} فقط!`
      );
      return;
    }

    const newMovement: InventoryMovement = {
      id: generateId(),
      itemId: selectedItemForMovement.id,
      itemName: selectedItemForMovement.name,
      type: movementForm.type,
      quantity: qty,
      reason: movementForm.reason.trim(),
      date: getTodayDateString(),
      responsible: movementForm.responsible.trim(),
      remainingQty: 0, // Will be computed in context
      notes: movementForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await recordInventoryMovement(newMovement);
    setIsMovementModalOpen(false);
  };

  // Add Custom Category
  const handleAddCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newCategoryName.trim();
    if (!cat) return;
    if (allCategories.includes(cat)) {
      alert('هذا التصنيف موجود بالفعل');
      return;
    }

    const updated = [...(settings.customCategories || []), cat];
    await updateSettings({ customCategories: updated });
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
    setSelectedCategory(cat);
  };

  // Image Upload helper
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setItemForm((prev) => ({ ...prev, imageUrl: base64 }));
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLowStock = !showLowStockOnly || item.quantity <= item.minAlertQty;

      return matchesCategory && matchesSearch && matchesLowStock;
    });
  }, [inventory, selectedCategory, searchTerm, showLowStockOnly]);

  const totalInventoryValuation = inventory.reduce(
    (acc, i) => acc + (i.totalValue || i.quantity * i.unitPrice || 0),
    0
  );
  const lowStockCount = inventory.filter((i) => i.quantity <= i.minAlertQty).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#007BFF]" />
            إدارة مخزون المصنع والخامات
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            متابعة حركة الوارد والمنصرف والهالك، تنبيهات النواقص، واحتساب القيمة الإجمالية تلقائياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-[#B0B0B0] hover:text-white bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] rounded-lg transition-all"
          >
            + إضافة تصنيف مخصص
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة صنف جديد
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي قيمة المخزون الحالية</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {formatCurrency(totalInventoryValuation, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            {inventory.length} صنف مسجل في المخازن
          </span>
        </div>

        <div
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`p-4 bg-[#121212] border rounded-xl cursor-pointer transition-all ${
            showLowStockOnly ? 'border-amber-500 bg-[#1e1307]' : 'border-[#222222] hover:border-amber-700/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#B0B0B0] block mb-1">أصناف تحت حد الطلب (نواقص)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-amber-400 tabular-nums">
            {lowStockCount} أصناف
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            {showLowStockOnly ? 'اضغط لعرض كافة الأصناف' : 'اضغط للتصفية بالأصناف الناقصة فقط'}
          </span>
        </div>

        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي حركات المخزون</span>
          <span className="text-xl font-bold text-white tabular-nums">{movements.length} حركة</span>
          <span className="text-[11px] text-[#888888] block mt-1">سجل كامل للوارد والمنصرف والهالك</span>
        </div>
      </div>

      {/* Categories Horizontal Carousel / Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('ALL');
            setShowLowStockOnly(false);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
            selectedCategory === 'ALL' && !showLowStockOnly
              ? 'bg-[#007BFF] text-white'
              : 'bg-[#121212] border border-[#27272a] text-[#B0B0B0] hover:text-white'
          }`}
        >
          كافة الأصناف ({inventory.length})
        </button>

        {allCategories.map((cat) => {
          const count = inventory.filter((i) => i.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setShowLowStockOnly(false);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#007BFF] text-white'
                  : 'bg-[#121212] border border-[#27272a] text-[#B0B0B0] hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Toolbar & Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[#0a0a0a] border border-[#222222] rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'items'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              جدول الأصناف الحالية
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'movements'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              سجل حركات المخزن ({movements.length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#666666]" />
          <input
            type="text"
            placeholder="بحث بالصنف أو الكود أو الموقع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8 pl-3 py-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF] w-64"
          />
        </div>
      </div>

      {/* Tab 1: Current Items Table */}
      {activeTab === 'items' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">صورة</th>
                  <th className="p-3.5">اسم الصنف</th>
                  <th className="p-3.5">الكود</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">الكمية الحالية</th>
                  <th className="p-3.5">سعر الوحدة</th>
                  <th className="p-3.5">إجمالي القيمة</th>
                  <th className="p-3.5">الموقع</th>
                  <th className="p-3.5 text-center">حركة مخزون</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-[#666666]">
                      لا توجد أصناف مطابقة للبحث أو التصفية الحالية. اضغط "إضافة صنف جديد" للبدء.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.quantity <= item.minAlertQty;
                    return (
                      <tr key={item.id} className="hover:bg-[#161616]">
                        <td className="p-3.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              onClick={() => setPreviewImage(item.imageUrl!)}
                              className="w-8 h-8 object-cover rounded border border-[#333333] cursor-pointer hover:opacity-80"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-[#1c1c1c] flex items-center justify-center text-[#555555]">
                              <Boxes className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {item.name}
                          {isLow && (
                            <span className="block text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              وصل للحد الأدنى ({item.minAlertQty} {item.unit})
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-[#007BFF] font-mono tabular-nums whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{item.category}</td>
                        <td className="p-3.5 font-bold whitespace-nowrap tabular-nums">
                          <span className={isLow ? 'text-amber-400' : 'text-white'}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                          {formatCurrency(item.unitPrice, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 font-bold text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(
                            item.totalValue || item.quantity * item.unitPrice,
                            settings.currencySymbol
                          )}
                        </td>
                        <td className="p-3.5 text-[#888888] whitespace-nowrap">{item.location}</td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenMovement(item, 'IN')}
                              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40 rounded text-[11px] font-semibold flex items-center gap-1"
                              title="تسجيل وارد / زيادة كمية"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              وارد
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenMovement(item, 'OUT')}
                              className="px-2 py-1 bg-blue-950/60 hover:bg-blue-900 text-[#007BFF] border border-blue-800/40 rounded text-[11px] font-semibold flex items-center gap-1"
                              title="تسجيل صرف / سحب"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              صرف
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenMovement(item, 'WASTE')}
                              className="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/40 rounded text-[11px] font-semibold"
                              title="تسجيل هالك / تالف"
                            >
                              هالك
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-[#007BFF] hover:bg-[#1a2536] rounded-md transition-colors"
                              title="تعديل الصنف"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                              title="حذف الصنف"
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
      )}

      {/* Tab 2: Movements Ledger */}
      {activeTab === 'movements' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">اسم الصنف</th>
                  <th className="p-3.5">نوع الحركة</th>
                  <th className="p-3.5">الكمية</th>
                  <th className="p-3.5">السبب / الغرض</th>
                  <th className="p-3.5">المتبقي بالمخزن</th>
                  <th className="p-3.5">المسؤول</th>
                  <th className="p-3.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#666666]">
                      لا توجد حركات مخزن مسجلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {mov.itemName}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mov.type === 'IN'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : mov.type === 'OUT'
                              ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                              : 'bg-red-950/60 text-red-400 border border-red-800/40'
                          }`}
                        >
                          {mov.type === 'IN' ? 'وارد +' : mov.type === 'OUT' ? 'صرف -' : 'هالك ✕'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold tabular-nums whitespace-nowrap">
                        {mov.type === 'IN' ? '+' : '-'} {mov.quantity}
                      </td>
                      <td className="p-3.5 text-white">{mov.reason}</td>
                      <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                        {mov.remainingQty}
                      </td>
                      <td className="p-3.5 text-[#888888] whitespace-nowrap">{mov.responsible}</td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(mov.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمخزون'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم الصنف <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حبيبات بولي بروبلين خام / براغي حديد 10 ملم"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    كود الصنف / SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.code}
                    onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">التصنيف</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c} className="bg-[#121212]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">الكمية</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={itemForm.quantity}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, quantity: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    وحدة القياس
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u} className="bg-[#121212]">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    سعر الوحدة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={itemForm.unitPrice}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    حد الطلب الأدنى للتنبيه
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.minAlertQty}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, minAlertQty: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    مكان التخزين
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رف 4 - مستودع أ"
                    value={itemForm.location}
                    onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  المورد / جهة التوريد
                </label>
                <input
                  type="text"
                  placeholder="اسم شركة التوريد أو الشخص"
                  value={itemForm.supplier}
                  onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  صورة الصنف (تخزين محلي آمن على جهازك)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white cursor-pointer hover:border-[#007BFF]">
                    <Upload className="w-3.5 h-3.5 text-[#007BFF]" />
                    <span>رفع صورة من الجهاز</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  {itemForm.imageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={itemForm.imageUrl}
                        alt="معاينة"
                        className="w-8 h-8 object-cover rounded border border-[#333333]"
                      />
                      <button
                        type="button"
                        onClick={() => setItemForm((prev) => ({ ...prev, imageUrl: '' }))}
                        className="text-xs text-red-400 hover:underline"
                      >
                        إزالة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  {editingItem ? 'تحديث الصنف' : 'حفظ الصنف بالمخزون'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal (وارد / صرف / هالك) */}
      {isMovementModalOpen && selectedItemForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-sm font-bold text-white">
                تسجيل حركة مخزون: {selectedItemForMovement.name}
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4">
              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222222] text-xs flex justify-between">
                <span className="text-[#B0B0B0]">الكمية الحالية بالمستودع:</span>
                <span className="font-bold text-[#007BFF] tabular-nums">
                  {selectedItemForMovement.quantity} {selectedItemForMovement.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  نوع الحركة
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: 'IN' })}
                    className={`p-2 text-xs font-bold rounded-lg border transition-all ${
                      movementForm.type === 'IN'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-[#000000] border-[#27272a] text-[#B0B0B0]'
                    }`}
                  >
                    وارد (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: 'OUT' })}
                    className={`p-2 text-xs font-bold rounded-lg border transition-all ${
                      movementForm.type === 'OUT'
                        ? 'bg-blue-950 border-[#007BFF] text-blue-300'
                        : 'bg-[#000000] border-[#27272a] text-[#B0B0B0]'
                    }`}
                  >
                    صرف (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: 'WASTE' })}
                    className={`p-2 text-xs font-bold rounded-lg border transition-all ${
                      movementForm.type === 'WASTE'
                        ? 'bg-red-950 border-red-500 text-red-300'
                        : 'bg-[#000000] border-[#27272a] text-[#B0B0B0]'
                    }`}
                  >
                    هالك وتالف (✕)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  الكمية ({selectedItemForMovement.unit})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={movementForm.quantity}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, quantity: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  السبب أو أمر التشغيل
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توريد دفعة جديدة / صرف لطلب تصنيع #12 / تلف بالماكينة"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  المسؤول عن الحركة
                </label>
                <input
                  type="text"
                  required
                  value={movementForm.responsible}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, responsible: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  تأكيد وتسجيل الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">إضافة تصنيف مخزون جديد</h3>
            <form onSubmit={handleAddCustomCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-[#B0B0B0] mb-1">اسم التصنيف الجديد</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قطع غيار خاصة"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#B0B0B0] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-lg"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-pointer"
        >
          <img
            src={previewImage}
            alt="صورة مكبرة"
            className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteInventoryItem(deleteConfirmId);
        }}
        title="تأكيد حذف الصنف"
        message="هل أنت متأكد من حذف هذا الصنف نهائياً من المخزون؟"
      />
    </div>
  );
};
