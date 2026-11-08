import React, { useState, useMemo } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Calendar,
  Upload,
  Image as ImageIcon,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  FileSpreadsheet,
  X,
  CreditCard,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { Expense, Revenue, Withdrawal, CapitalTransaction } from '../types';
import {
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
  fileToBase64,
} from '../utils/helpers';
import { ConfirmModal } from '../components/ConfirmModal';

const EXPENSE_CATEGORIES: Expense['category'][] = [
  'الرواتب',
  'شراء الخامات',
  'شراء المعدات',
  'الصيانة',
  'الكهرباء',
  'المياه',
  'الإيجار',
  'الدهانات',
  'التشطيبات',
  'النقل',
  'مصروفات أخرى',
];

const REVENUE_TYPES: Revenue['type'][] = [
  'مبيعات منتجات',
  'خدمات تشغيل',
  'خردة وهالك',
  'أخرى',
];

const PAYMENT_METHODS: Revenue['paymentMethod'][] = [
  'نقدي',
  'تحويل بنكي',
  'شيك',
  'فودافون كاش',
  'أخرى',
];

export const FinancialsView: React.FC = () => {
  const {
    metrics,
    expenses,
    revenues,
    withdrawals,
    capitalTransactions,
    addExpense,
    deleteExpense,
    addRevenue,
    deleteRevenue,
    addWithdrawal,
    deleteWithdrawal,
    addCapitalTransaction,
    deleteCapitalTransaction,
    settings,
  } = useFactory();

  const [activeTab, setActiveTab] = useState<'expenses' | 'revenues' | 'withdrawals' | 'capital'>(
    'expenses'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    id: string;
    type: 'expense' | 'revenue' | 'withdrawal' | 'capital';
  } | null>(null);

  // Expense Form
  const [expenseForm, setExpenseForm] = useState<{
    title: string;
    amount: number;
    date: string;
    category: Expense['category'];
    reason: string;
    responsible: string;
    invoiceUrl?: string;
    notes: string;
  }>({
    title: '',
    amount: 1000,
    date: getTodayDateString(),
    category: 'شراء الخامات',
    reason: '',
    responsible: 'المحاسب المالي',
    invoiceUrl: '',
    notes: '',
  });

  // Revenue Form
  const [revenueForm, setRevenueForm] = useState<{
    source: string;
    amount: number;
    date: string;
    type: Revenue['type'];
    clientName: string;
    paymentMethod: Revenue['paymentMethod'];
    notes: string;
  }>({
    source: '',
    amount: 5000,
    date: getTodayDateString(),
    type: 'مبيعات منتجات',
    clientName: '',
    paymentMethod: 'نقدي',
    notes: '',
  });

  // Withdrawal Form
  const [withdrawalForm, setWithdrawalForm] = useState<{
    amount: number;
    date: string;
    responsible: string;
    reason: string;
    notes: string;
  }>({
    amount: 2000,
    date: getTodayDateString(),
    responsible: 'الشريك / المدير العام',
    reason: 'سحب أرباح شخصية للمالك',
    notes: '',
  });

  // Capital Form
  const [capitalForm, setCapitalForm] = useState<{
    type: CapitalTransaction['type'];
    amount: number;
    date: string;
    responsible: string;
    notes: string;
  }>({
    type: 'ADDITION',
    amount: 50000,
    date: getTodayDateString(),
    responsible: 'أصحاب رأس المال',
    notes: 'ضخ سيولة نقدية جديدة لدعم خطوط الإنتاج',
  });

  // Save Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim()) return;

    const newExp: Expense = {
      id: generateId(),
      title: expenseForm.title.trim(),
      amount: Number(expenseForm.amount) || 0,
      date: expenseForm.date,
      category: expenseForm.category,
      reason: expenseForm.reason.trim(),
      responsible: expenseForm.responsible.trim(),
      invoiceUrl: expenseForm.invoiceUrl || undefined,
      notes: expenseForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addExpense(newExp);
    setIsExpenseModalOpen(false);
  };

  // Save Revenue
  const handleSaveRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revenueForm.source.trim()) return;

    const newRev: Revenue = {
      id: generateId(),
      source: revenueForm.source.trim(),
      amount: Number(revenueForm.amount) || 0,
      date: revenueForm.date,
      type: revenueForm.type,
      clientName: revenueForm.clientName.trim() || 'عميل عام',
      paymentMethod: revenueForm.paymentMethod,
      notes: revenueForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addRevenue(newRev);
    setIsRevenueModalOpen(false);
  };

  // Save Withdrawal
  const handleSaveWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalForm.reason.trim()) return;

    const newW: Withdrawal = {
      id: generateId(),
      amount: Number(withdrawalForm.amount) || 0,
      date: withdrawalForm.date,
      responsible: withdrawalForm.responsible.trim(),
      reason: withdrawalForm.reason.trim(),
      notes: withdrawalForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addWithdrawal(newW);
    setIsWithdrawalModalOpen(false);
  };

  // Save Capital Transaction
  const handleSaveCapital = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCap: CapitalTransaction = {
      id: generateId(),
      type: capitalForm.type,
      amount: Number(capitalForm.amount) || 0,
      date: capitalForm.date,
      responsible: capitalForm.responsible.trim(),
      notes: capitalForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addCapitalTransaction(newCap);
    setIsCapitalModalOpen(false);
  };

  // Image upload handler for expense invoice
  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setExpenseForm((prev) => ({ ...prev, invoiceUrl: base64 }));
      } catch (err) {
        console.error('Failed to read invoice file:', err);
      }
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        selectedCategoryFilter === 'ALL' || e.category === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, searchTerm, selectedCategoryFilter]);

  // Filtered Revenues
  const filteredRevenues = useMemo(() => {
    return revenues.filter((r) => {
      return (
        r.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [revenues, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-[#007BFF]" />
            إدارة رأس المال والحسابات المالية
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            دفتر الأستاذ العام، الإيرادات والمصروفات، سحوبات الشركاء، والرصيد النقدي الفعلي
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCapitalForm({
                type: 'INITIAL',
                amount: 100000,
                date: getTodayDateString(),
                responsible: 'إدارة المصنع',
                notes: 'تسجيل رأس المال الأساسي التأسيسي للمصنع',
              });
              setIsCapitalModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-white bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] rounded-lg transition-all"
          >
            تعديل رأس المال
          </button>
          <button
            type="button"
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-white bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] rounded-lg transition-all"
          >
            تسجيل سحب شركاء
          </button>
          <button
            type="button"
            onClick={() => setIsRevenueModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            تسجيل إيراد جديد
          </button>
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            تسجيل مصروف جديد
          </button>
        </div>
      </div>

      {/* Comprehensive Accounting Dashboard Strip (Strict Separation as requested) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* 1. رأس المال الصافي */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">صافي رأس المال</span>
          <span className="text-base font-bold text-white tabular-nums block">
            {formatCurrency(metrics.netCapital, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-[#888888]">
            الأساسي + الإضافات - سحوبات رأس المال
          </span>
        </div>

        {/* 2. إجمالي الإيرادات */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">إجمالي الإيرادات (+)</span>
          <span className="text-base font-bold text-emerald-400 tabular-nums block">
            +{formatCurrency(metrics.totalRevenue, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-[#888888]">{revenues.length} عملية إيراد</span>
        </div>

        {/* 3. إجمالي المصروفات */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">إجمالي المصروفات (-)</span>
          <span className="text-base font-bold text-red-400 tabular-nums block">
            -{formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-[#888888]">{expenses.length} عملية مصروف</span>
        </div>

        {/* 4. صافي الأرباح التشغيلية */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">صافي الأرباح / الخسائر</span>
          <span
            className={`text-base font-bold tabular-nums block ${
              metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {metrics.netProfit >= 0 ? '+ ' : ''}
            {formatCurrency(metrics.netProfit, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-[#888888]">(الإيرادات - المصروفات)</span>
        </div>

        {/* 5. الرصيد النقدي الحالي */}
        <div className="p-3.5 bg-[#121212] border border-[#007BFF]/40 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[11px] text-[#007BFF] block font-bold mb-1">
            الرصيد النقدي بالخزينة
          </span>
          <span
            className={`text-lg font-extrabold tabular-nums block ${
              metrics.currentCashBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(metrics.currentCashBalance, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-[#888888]">السيولة الحقيقية المتاحة</span>
        </div>
      </div>

      {/* Tabs & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[#0a0a0a] border border-[#222222] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setActiveTab('expenses');
                setSelectedCategoryFilter('ALL');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              المصروفات ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('revenues');
                setSelectedCategoryFilter('ALL');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'revenues'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              الإيرادات ({revenues.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'withdrawals'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              سحوبات الشركاء ({withdrawals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('capital')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'capital'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              حركات رأس المال ({capitalTransactions.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#666666]" />
            <input
              type="text"
              placeholder="بحث في الحركات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 pl-3 py-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF] w-56"
            />
          </div>

          {activeTab === 'expenses' && (
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="ALL">جميع تصنيفات المصروفات</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">اسم المصروف</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">السبب / الغرض</th>
                  <th className="p-3.5">المسؤول</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5 text-center">فاتورة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#666666]">
                      لا توجد مصروفات مسجلة مطابقة للبحث. اضغط "تسجيل مصروف جديد" للبدء.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {exp.title}
                        {exp.notes && (
                          <span className="block text-[10px] text-[#888888] font-normal">
                            {exp.notes}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-red-400 tabular-nums whitespace-nowrap">
                        -{formatCurrency(exp.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-[#007BFF] whitespace-nowrap">{exp.category}</td>
                      <td className="p-3.5 text-white">{exp.reason}</td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{exp.responsible}</td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {exp.invoiceUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(exp.invoiceUrl!)}
                            className="p-1 text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>عرض</span>
                          </button>
                        ) : (
                          <span className="text-[#555555]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmData({ id: exp.id, type: 'expense' })}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                          title="حذف المصروف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Revenues */}
      {activeTab === 'revenues' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">مصدر الإيراد</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">نوع الإيراد</th>
                  <th className="p-3.5">العميل / الجهة</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredRevenues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#666666]">
                      لا توجد إيرادات مسجلة حتى الآن. اضغط "تسجيل إيراد جديد" للبدء.
                    </td>
                  </tr>
                ) : (
                  filteredRevenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {rev.source}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                        +{formatCurrency(rev.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-[#007BFF] whitespace-nowrap">{rev.type}</td>
                      <td className="p-3.5 text-white whitespace-nowrap">{rev.clientName}</td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">
                        {rev.paymentMethod}
                      </td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(rev.date)}
                      </td>
                      <td className="p-3.5 text-[#888888]">{rev.notes || '-'}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmData({ id: rev.id, type: 'revenue' })}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                          title="حذف الإيراد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Withdrawals (سحوبات الشركاء) */}
      {activeTab === 'withdrawals' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">المبلغ المسحوب</th>
                  <th className="p-3.5">اسم الشريك / المسؤول</th>
                  <th className="p-3.5">سبب السحب</th>
                  <th className="p-3.5">تاريخ السحب</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#666666]">
                      لا توجد أي سحوبات شخصية مسجلة للشركاء.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white tabular-nums whitespace-nowrap">
                        {formatCurrency(w.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                        {w.responsible}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{w.reason}</td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(w.date)}
                      </td>
                      <td className="p-3.5 text-[#888888]">{w.notes || '-'}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmData({ id: w.id, type: 'withdrawal' })}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                          title="حذف السحب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Capital Transactions */}
      {activeTab === 'capital' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">نوع الحركة</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">المسؤول / الشريك</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">بيان تفصيلي</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {capitalTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#666666]">
                      لم يتم تسجيل أي حركة رأس مال. اضغط "تعديل رأس المال" للبدء بتعيين رأس المال
                      الأساسي.
                    </td>
                  </tr>
                ) : (
                  capitalTransactions.map((cap) => (
                    <tr key={cap.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cap.type === 'INITIAL'
                              ? 'bg-blue-950 text-[#007BFF] border border-blue-900'
                              : cap.type === 'ADDITION'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                              : 'bg-red-950 text-red-400 border border-red-900'
                          }`}
                        >
                          {cap.type === 'INITIAL'
                            ? 'رأس مال أساسي'
                            : cap.type === 'ADDITION'
                            ? 'زيادة رأس مال (+)'
                            : 'تخفيض / سحب رأس مال (-)'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white tabular-nums whitespace-nowrap">
                        {formatCurrency(cap.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-white whitespace-nowrap">{cap.responsible}</td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(cap.date)}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0]">{cap.notes || '-'}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmData({ id: cap.id, type: 'capital' })}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                          title="حذف حركة رأس المال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-400" />
                تسجيل مصروف مصنع جديد
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم المصروف أو البند <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة كهرباء شهرية / شراء مواد تغليف / وقود سيارات"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    المبلغ ({settings.currencySymbol}) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    required
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تصنيف المصروف
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, category: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#121212]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ المصروف
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    المسؤول عن الصرف
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseForm.responsible}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, responsible: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  سبب المصروف والتفاصيل
                </label>
                <input
                  type="text"
                  required
                  placeholder="سبب الصرف وأي تفاصيل مرتبطة..."
                  value={expenseForm.reason}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              {/* Invoice Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  صورة الفاتورة أو الإيصال (حفظ محلي آمن على الجهاز)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white cursor-pointer hover:border-[#007BFF]">
                    <Upload className="w-3.5 h-3.5 text-[#007BFF]" />
                    <span>رفع صورة الفاتورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInvoiceUpload}
                      className="hidden"
                    />
                  </label>
                  {expenseForm.invoiceUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={expenseForm.invoiceUrl}
                        alt="معاينة الفاتورة"
                        className="w-8 h-8 object-cover rounded border border-[#333333]"
                      />
                      <button
                        type="button"
                        onClick={() => setExpenseForm((prev) => ({ ...prev, invoiceUrl: '' }))}
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
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  تسجيل المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                تسجيل إيراد مصنع جديد
              </h3>
              <button
                onClick={() => setIsRevenueModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRevenue} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  مصدر الإيراد <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توريد دفعة منتجات جاهزة / خدمة تشغيل ماكينة للغير"
                  value={revenueForm.source}
                  onChange={(e) => setRevenueForm({ ...revenueForm, source: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    المبلغ المحصل ({settings.currencySymbol}) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    required
                    value={revenueForm.amount}
                    onChange={(e) =>
                      setRevenueForm({ ...revenueForm, amount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums font-bold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    نوع الإيراد
                  </label>
                  <select
                    value={revenueForm.type}
                    onChange={(e) =>
                      setRevenueForm({ ...revenueForm, type: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    {REVENUE_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#121212]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    اسم العميل أو الجهة
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اسم العميل أو الشركة"
                    value={revenueForm.clientName}
                    onChange={(e) =>
                      setRevenueForm({ ...revenueForm, clientName: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    طريقة الدفع
                  </label>
                  <select
                    value={revenueForm.paymentMethod}
                    onChange={(e) =>
                      setRevenueForm({ ...revenueForm, paymentMethod: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm} className="bg-[#121212]">
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  تاريخ التحصيل
                </label>
                <input
                  type="date"
                  required
                  value={revenueForm.date}
                  onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  ملاحظات إضافية
                </label>
                <input
                  type="text"
                  value={revenueForm.notes}
                  onChange={(e) => setRevenueForm({ ...revenueForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsRevenueModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  حفظ الإيراد بالخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Withdrawal Modal */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[#007BFF]" />
              تسجيل سحب من أموال المصنع (سحوبات الشركاء)
            </h3>

            <form onSubmit={handleSaveWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  المبلغ المسحوب ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={withdrawalForm.amount}
                  onChange={(e) =>
                    setWithdrawalForm({ ...withdrawalForm, amount: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم الشريك / المستلم
                </label>
                <input
                  type="text"
                  required
                  value={withdrawalForm.responsible}
                  onChange={(e) =>
                    setWithdrawalForm({ ...withdrawalForm, responsible: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">سبب السحب</label>
                <input
                  type="text"
                  required
                  value={withdrawalForm.reason}
                  onChange={(e) =>
                    setWithdrawalForm({ ...withdrawalForm, reason: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  تاريخ السحب
                </label>
                <input
                  type="date"
                  required
                  value={withdrawalForm.date}
                  onChange={(e) =>
                    setWithdrawalForm({ ...withdrawalForm, date: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawalModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-lg shadow-sm"
                >
                  تسجيل السحب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Capital Transaction Modal */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">حركة رأس مال المصنع</h3>

            <form onSubmit={handleSaveCapital} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  نوع الحركة
                </label>
                <select
                  value={capitalForm.type}
                  onChange={(e) =>
                    setCapitalForm({ ...capitalForm, type: e.target.value as any })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="INITIAL">رأس مال أساسي (تأسيس المصنع)</option>
                  <option value="ADDITION">زيادة / ضخ في رأس المال (+)</option>
                  <option value="WITHDRAWAL">تخفيض / سحب من رأس المال (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  المبلغ ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  required
                  value={capitalForm.amount}
                  onChange={(e) =>
                    setCapitalForm({ ...capitalForm, amount: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  المسؤول / الشركاء
                </label>
                <input
                  type="text"
                  required
                  value={capitalForm.responsible}
                  onChange={(e) =>
                    setCapitalForm({ ...capitalForm, responsible: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  value={capitalForm.date}
                  onChange={(e) => setCapitalForm({ ...capitalForm, date: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  البيان والملاحظات
                </label>
                <input
                  type="text"
                  value={capitalForm.notes}
                  onChange={(e) => setCapitalForm({ ...capitalForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-lg shadow-sm"
                >
                  حفظ الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-pointer"
        >
          <img
            src={previewImage}
            alt="صورة الفاتورة"
            className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmData}
        onClose={() => setDeleteConfirmData(null)}
        onConfirm={() => {
          if (!deleteConfirmData) return;
          if (deleteConfirmData.type === 'expense') {
            deleteExpense(deleteConfirmData.id);
          } else if (deleteConfirmData.type === 'revenue') {
            deleteRevenue(deleteConfirmData.id);
          } else if (deleteConfirmData.type === 'withdrawal') {
            deleteWithdrawal(deleteConfirmData.id);
          } else {
            deleteCapitalTransaction(deleteConfirmData.id);
          }
        }}
        title="تأكيد الحذف المالي"
        message="هل أنت متأكد من حذف هذه الحركة المالية؟ سيتم إعادة احتساب الأرباح والسيولة تلقائياً."
      />
    </div>
  );
};
