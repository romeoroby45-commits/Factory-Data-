import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Calendar,
  Search,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  Users,
  Boxes,
  Wrench,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import {
  formatCurrency,
  formatDate,
  getTodayDateString,
  exportToExcelCsv,
  triggerPrint,
} from '../utils/helpers';

export type ReportType =
  | 'employees'
  | 'salaries'
  | 'deductions'
  | 'equipment'
  | 'machines'
  | 'inventory'
  | 'raw_materials'
  | 'wip'
  | 'finished_products'
  | 'expenses'
  | 'revenues'
  | 'withdrawals'
  | 'capital'
  | 'pnl'
  | 'comprehensive_financial';

interface ReportMeta {
  id: ReportType;
  title: string;
  category: 'hr' | 'production' | 'finance';
}

const REPORTS_LIST: ReportMeta[] = [
  { id: 'comprehensive_financial', title: 'تقرير مالي شامل للمصنع', category: 'finance' },
  { id: 'pnl', title: 'تقرير الأرباح والخسائر', category: 'finance' },
  { id: 'expenses', title: 'تقرير المصروفات', category: 'finance' },
  { id: 'revenues', title: 'تقرير الإيرادات', category: 'finance' },
  { id: 'capital', title: 'تقرير حركة رأس المال', category: 'finance' },
  { id: 'withdrawals', title: 'تقرير سحوبات الشركاء', category: 'finance' },
  { id: 'employees', title: 'تقرير الموظفين والعمال', category: 'hr' },
  { id: 'salaries', title: 'تقرير كشف الرواتب الشهري', category: 'hr' },
  { id: 'deductions', title: 'تقرير الخصومات والجزاءات', category: 'hr' },
  { id: 'inventory', title: 'تقرير المخزون العام', category: 'production' },
  { id: 'raw_materials', title: 'تقرير الخامات ومستلزمات الإنتاج', category: 'production' },
  { id: 'wip', title: 'تقرير المنتجات تحت التشغيل', category: 'production' },
  { id: 'finished_products', title: 'تقرير المنتجات التامة والمبيعات', category: 'production' },
  { id: 'machines', title: 'تقرير الماكينات وحالتها الفنية', category: 'production' },
  { id: 'equipment', title: 'تقرير المعدات والأجهزة', category: 'production' },
];

export const ReportsView: React.FC = () => {
  const {
    settings,
    metrics,
    employees,
    payrolls,
    deductions,
    equipment,
    machines,
    inventory,
    workInProgress,
    finishedProducts,
    expenses,
    revenues,
    withdrawals,
    capitalTransactions,
  } = useFactory();

  // Filters
  const [selectedReport, setSelectedReport] = useState<ReportType>('comprehensive_financial');
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [itemSearch, setItemSearch] = useState<string>('');

  const reportTitle = REPORTS_LIST.find((r) => r.id === selectedReport)?.title || 'تقرير المصنع';

  // Helper date checker
  const isWithinDateRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = new Date(dateStr).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return d >= start && d <= end + 86400000;
  };

  // Export to Excel handler based on active report
  const handleExportExcel = () => {
    const filename = `تقرير_${reportTitle.replace(/\s+/g, '_')}_${getTodayDateString()}`;

    if (selectedReport === 'employees') {
      const headers = ['اسم الموظف', 'رقم الهاتف', 'المهنة', 'الراتب الأساسي', 'تاريخ التعيين', 'الحالة', 'الرقم القومي'];
      const rows = employees.map((e) => [
        e.name,
        `${e.countryCode} ${e.phone}`,
        e.role,
        e.basicSalary,
        formatDate(e.hireDate),
        e.status === 'active' ? 'نشط' : 'غير نشط',
        e.nationalId || '',
      ]);
      exportToExcelCsv(filename, headers, rows);
    } else if (selectedReport === 'expenses') {
      const filtered = expenses.filter((e) => isWithinDateRange(e.date));
      const headers = ['اسم المصروف', 'المبلغ', 'التصنيف', 'السبب', 'المسؤول', 'التاريخ', 'ملاحظات'];
      const rows = filtered.map((e) => [
        e.title,
        e.amount,
        e.category,
        e.reason,
        e.responsible,
        formatDate(e.date),
        e.notes || '',
      ]);
      exportToExcelCsv(filename, headers, rows);
    } else if (selectedReport === 'revenues') {
      const filtered = revenues.filter((r) => isWithinDateRange(r.date));
      const headers = ['مصدر الإيراد', 'المبلغ', 'النوع', 'العميل', 'طريقة الدفع', 'التاريخ'];
      const rows = filtered.map((r) => [
        r.source,
        r.amount,
        r.type,
        r.clientName,
        r.paymentMethod,
        formatDate(r.date),
      ]);
      exportToExcelCsv(filename, headers, rows);
    } else if (selectedReport === 'inventory' || selectedReport === 'raw_materials') {
      const items =
        selectedReport === 'raw_materials'
          ? inventory.filter((i) => i.category === 'الخامات')
          : inventory;
      const headers = ['اسم الصنف', 'الكود', 'التصنيف', 'الكمية', 'الوحدة', 'سعر الوحدة', 'إجمالي القيمة', 'الموقع'];
      const rows = items.map((i) => [
        i.name,
        i.code,
        i.category,
        i.quantity,
        i.unit,
        i.unitPrice,
        i.totalValue || i.quantity * i.unitPrice,
        i.location,
      ]);
      exportToExcelCsv(filename, headers, rows);
    } else {
      // General financial statement export
      const headers = ['البند المالي', 'القيمة الإجمالية', 'البيان التوضيحي'];
      const rows = [
        ['صافي رأس المال', metrics.netCapital, 'رأس المال الأساسي + الإضافات - السحوبات'],
        ['إجمالي الإيرادات', metrics.totalRevenue, 'كافة الإيرادات المحصلة'],
        ['إجمالي المصروفات التشغيلية', metrics.totalExpenses, 'كافة المصروفات المنفقة'],
        ['صافي الأرباح والخسائر', metrics.netProfit, 'الإيرادات - المصروفات'],
        ['إجمالي قيمة المخزون الحالي', metrics.totalInventoryValuation, 'قيمة الخامات والمستلزمات'],
        ['إجمالي قيمة الماكينات والمعدات', metrics.totalEquipmentValuation, 'أصول المصنع الثابتة'],
        ['الرصيد النقدي الحالي بالخزينة', metrics.currentCashBalance, 'السيولة المتاحة فعلياً'],
      ];
      exportToExcelCsv(filename, headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#007BFF]" />
            التقارير الشاملة والطباعة وتصدير Excel
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            15 تقريراً تحليلياً وتفصيلياً لجميع أنشطة المصنع جاهزة للطباعة والتصدير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            تصدير إلى Excel
          </button>
          <button
            type="button"
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير / PDF
          </button>
        </div>
      </div>

      {/* Report Selection Carousel & Filters (Hidden in print) */}
      <div className="no-print space-y-4">
        {/* Horizontal Category Badges for Reports */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {REPORTS_LIST.map((r) => {
            const isSelected = selectedReport === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedReport(r.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#007BFF] text-white shadow-md'
                    : 'bg-[#121212] border border-[#27272a] text-[#B0B0B0] hover:text-white'
                }`}
              >
                {r.title}
              </button>
            );
          })}
        </div>

        {/* Date Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#007BFF]" />
              <span className="text-xs text-[#B0B0B0]">من تاريخ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#B0B0B0]">إلى تاريخ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            {(selectedReport === 'salaries' || selectedReport === 'deductions') && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#B0B0B0]">الموظف:</span>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="ALL">كافة الموظفين</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-xs text-[#888888]">
            تاريخ إعداد التقرير:{' '}
            <span className="text-white font-mono">{formatDate(getTodayDateString())}</span>
          </div>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="print-container bg-[#121212] border border-[#222222] rounded-xl p-6 sm:p-8 space-y-6">
        {/* Report Official Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#007BFF] flex items-center justify-center font-extrabold text-white text-lg">
              FD
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">{settings.factoryName}</h2>
              <p className="text-xs text-[#B0B0B0]">
                {settings.address} · هاتف: {settings.phone}
              </p>
            </div>
          </div>

          <div className="text-left">
            <div className="text-base font-extrabold text-[#007BFF]">{reportTitle}</div>
            <div className="text-xs text-[#888888] tabular-nums">
              الفترة: من {formatDate(startDate)} إلى {formatDate(endDate)}
            </div>
          </div>
        </div>

        {/* Dynamic Content based on selectedReport */}

        {/* 1. تقرير مالي شامل للمصنع */}
        {selectedReport === 'comprehensive_financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-lg">
                <span className="text-[11px] text-[#B0B0B0] block">صافي رأس المال</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {formatCurrency(metrics.netCapital, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-lg">
                <span className="text-[11px] text-[#B0B0B0] block">إجمالي الإيرادات</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(metrics.totalRevenue, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-lg">
                <span className="text-[11px] text-[#B0B0B0] block">إجمالي المصروفات</span>
                <span className="text-sm font-bold text-red-400 tabular-nums">
                  {formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
                </span>
              </div>
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-lg">
                <span className="text-[11px] text-[#B0B0B0] block">صافي الأرباح</span>
                <span className="text-sm font-bold text-[#007BFF] tabular-nums">
                  {formatCurrency(metrics.netProfit, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">البند المالي والتشغيلي</th>
                  <th className="p-3">القيمة المحسوبة</th>
                  <th className="p-3">التفاصيل والتوضيح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                <tr>
                  <td className="p-3 font-bold text-white">رأس المال الأساسي التأسيسي</td>
                  <td className="p-3 tabular-nums font-bold text-white">
                    {formatCurrency(metrics.baseCapital, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">المبلغ التأسيسي الأساسي للمصنع</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">إضافات رأس المال</td>
                  <td className="p-3 tabular-nums text-emerald-400 font-bold">
                    +{formatCurrency(metrics.capitalAdditions, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">زيادات رأس المال وضخ السيولة</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">إجمالي إيرادات المبيعات والخدمات</td>
                  <td className="p-3 tabular-nums text-emerald-400 font-bold">
                    +{formatCurrency(metrics.totalRevenue, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">إجمالي التدفقات النقدية الداخلة</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">إجمالي المصروفات التشغيلية</td>
                  <td className="p-3 tabular-nums text-red-400 font-bold">
                    -{formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">الرواتب، خامات، صيانة، طاقة، ونقل</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">سحوبات الشركاء من الأرباح</td>
                  <td className="p-3 tabular-nums text-white font-bold">
                    -{formatCurrency(metrics.totalWithdrawals, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">سحوبات نقدية خاصة بأصحاب المصنع</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">إجمالي تقييم مخزون المصنع</td>
                  <td className="p-3 tabular-nums text-[#007BFF] font-bold">
                    {formatCurrency(metrics.totalInventoryValuation, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">قيمة المواد الخام والمنتجات المتاحة</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">إجمالي قيمة الماكينات والمعدات</td>
                  <td className="p-3 tabular-nums text-[#007BFF] font-bold">
                    {formatCurrency(metrics.totalEquipmentValuation, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">الأصول الإنتاجية الثابتة للمصنع</td>
                </tr>
                <tr className="bg-[#050505] font-extrabold">
                  <td className="p-3 text-white text-sm">الرصيد النقدي الفعلي المتاح بالخزينة</td>
                  <td
                    className={`p-3 text-sm tabular-nums ${
                      metrics.currentCashBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatCurrency(metrics.currentCashBalance, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0]">السيولة الحقيقية الجاهزة للصرف</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 2. تقرير الأرباح والخسائر P&L */}
        {selectedReport === 'pnl' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-[#B0B0B0] block">صافي الأرباح التشغيلية</span>
                <span
                  className={`text-xl font-bold tabular-nums ${
                    metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {metrics.netProfit >= 0 ? 'ربح صافي: + ' : 'خسارة: - '}
                  {formatCurrency(Math.abs(metrics.netProfit), settings.currencySymbol)}
                </span>
              </div>
              <div className="text-xs text-[#888888]">
                معدل هامش الربح:{' '}
                {metrics.totalRevenue > 0
                  ? `${Math.round((metrics.netProfit / metrics.totalRevenue) * 100)}%`
                  : '0%'}
              </div>
            </div>

            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">البند</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">النسبة من الإيرادات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                <tr>
                  <td className="p-3 font-bold text-white">إجمالي إيرادات المبيعات والتشغيل</td>
                  <td className="p-3 font-bold text-emerald-400 tabular-nums">
                    +{formatCurrency(metrics.totalRevenue, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0] tabular-nums">100%</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">إجمالي مصروفات الرواتب والأجور</td>
                  <td className="p-3 text-red-400 font-semibold tabular-nums">
                    -{formatCurrency(metrics.totalSalariesPaid, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-[#B0B0B0] tabular-nums">
                    {metrics.totalRevenue > 0
                      ? `${Math.round((metrics.totalSalariesPaid / metrics.totalRevenue) * 100)}%`
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">باقي المصروفات العامة والتشغيلية</td>
                  <td className="p-3 text-red-400 font-semibold tabular-nums">
                    -
                    {formatCurrency(
                      metrics.totalExpenses - metrics.totalSalariesPaid,
                      settings.currencySymbol
                    )}
                  </td>
                  <td className="p-3 text-[#B0B0B0] tabular-nums">
                    {metrics.totalRevenue > 0
                      ? `${Math.round(
                          ((metrics.totalExpenses - metrics.totalSalariesPaid) /
                            metrics.totalRevenue) *
                            100
                        )}%`
                      : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 3. تقرير المصروفات */}
        {selectedReport === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">المصروف</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">السبب</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {expenses
                  .filter((e) => isWithinDateRange(e.date))
                  .map((e) => (
                    <tr key={e.id}>
                      <td className="p-3 font-bold text-white">{e.title}</td>
                      <td className="p-3 font-bold text-red-400 tabular-nums">
                        {formatCurrency(e.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3 text-[#007BFF]">{e.category}</td>
                      <td className="p-3 text-white">{e.reason}</td>
                      <td className="p-3 text-[#B0B0B0]">{e.responsible}</td>
                      <td className="p-3 text-[#888888] tabular-nums">{formatDate(e.date)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. تقرير الإيرادات */}
        {selectedReport === 'revenues' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">مصدر الإيراد</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">نوع الإيراد</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {revenues
                  .filter((r) => isWithinDateRange(r.date))
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-bold text-white">{r.source}</td>
                      <td className="p-3 font-bold text-emerald-400 tabular-nums">
                        +{formatCurrency(r.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3 text-[#007BFF]">{r.type}</td>
                      <td className="p-3 text-white">{r.clientName}</td>
                      <td className="p-3 text-[#B0B0B0]">{r.paymentMethod}</td>
                      <td className="p-3 text-[#888888] tabular-nums">{formatDate(r.date)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. تقرير الموظفين */}
        {selectedReport === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">المهنة</th>
                  <th className="p-3">الراتب الأساسي</th>
                  <th className="p-3">تاريخ التعيين</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="p-3 font-bold text-white">{emp.name}</td>
                    <td className="p-3 tabular-nums">
                      {emp.countryCode} {emp.phone}
                    </td>
                    <td className="p-3 text-[#B0B0B0]">{emp.role}</td>
                    <td className="p-3 font-bold text-[#007BFF] tabular-nums">
                      {formatCurrency(emp.basicSalary, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-[#888888] tabular-nums">{formatDate(emp.hireDate)}</td>
                    <td className="p-3">
                      <span className={emp.status === 'active' ? 'text-emerald-400' : 'text-red-400'}>
                        {emp.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. تقرير المخزون العام */}
        {(selectedReport === 'inventory' || selectedReport === 'raw_materials') && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم الصنف</th>
                  <th className="p-3">الكود</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">الكمية الحالية</th>
                  <th className="p-3">سعر الوحدة</th>
                  <th className="p-3">إجمالي القيمة</th>
                  <th className="p-3">مكان التخزين</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {(selectedReport === 'raw_materials'
                  ? inventory.filter((i) => i.category === 'الخامات')
                  : inventory
                ).map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3 text-[#007BFF] font-mono tabular-nums">{item.code}</td>
                    <td className="p-3 text-[#B0B0B0]">{item.category}</td>
                    <td className="p-3 text-white tabular-nums font-bold">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3 text-[#B0B0B0] tabular-nums">
                      {formatCurrency(item.unitPrice, settings.currencySymbol)}
                    </td>
                    <td className="p-3 font-bold text-white tabular-nums">
                      {formatCurrency(
                        item.totalValue || item.quantity * item.unitPrice,
                        settings.currencySymbol
                      )}
                    </td>
                    <td className="p-3 text-[#888888]">{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. تقرير الماكينات */}
        {selectedReport === 'machines' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم الماكينة</th>
                  <th className="p-3">الكود</th>
                  <th className="p-3">العدد</th>
                  <th className="p-3">سعر الشراء</th>
                  <th className="p-3">القسم</th>
                  <th className="p-3">الحالة التشغيلية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {machines.map((m) => (
                  <tr key={m.id}>
                    <td className="p-3 font-bold text-white">{m.name}</td>
                    <td className="p-3 text-[#007BFF] font-mono tabular-nums">{m.code}</td>
                    <td className="p-3 tabular-nums">{m.quantity || 1}</td>
                    <td className="p-3 font-semibold tabular-nums">
                      {formatCurrency(m.purchasePrice, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-[#B0B0B0]">{m.department}</td>
                    <td className="p-3 text-emerald-400 font-semibold">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. تقرير المعدات */}
        {selectedReport === 'equipment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم المعدة</th>
                  <th className="p-3">الكود</th>
                  <th className="p-3">العدد</th>
                  <th className="p-3">سعر الوحدة</th>
                  <th className="p-3">إجمالي القيمة</th>
                  <th className="p-3">الموقع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {equipment.map((eq) => (
                  <tr key={eq.id}>
                    <td className="p-3 font-bold text-white">{eq.name}</td>
                    <td className="p-3 text-[#007BFF] font-mono tabular-nums">{eq.code}</td>
                    <td className="p-3 tabular-nums">{eq.quantity}</td>
                    <td className="p-3 tabular-nums">
                      {formatCurrency(eq.unitPrice, settings.currencySymbol)}
                    </td>
                    <td className="p-3 font-bold tabular-nums">
                      {formatCurrency(eq.totalValue, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-[#B0B0B0]">{eq.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 9. تقرير الخصومات */}
        {selectedReport === 'deductions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">سبب الخصم</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {deductions
                  .filter((d) => employeeFilter === 'ALL' || d.employeeId === employeeFilter)
                  .filter((d) => isWithinDateRange(d.date))
                  .map((d) => (
                    <tr key={d.id}>
                      <td className="p-3 font-bold text-white">{d.employeeName}</td>
                      <td className="p-3 font-bold text-red-400 tabular-nums">
                        -{formatCurrency(d.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3 text-white">{d.reason}</td>
                      <td className="p-3 text-[#B0B0B0]">{d.responsible}</td>
                      <td className="p-3 text-[#888888] tabular-nums">{formatDate(d.date)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 10. تقرير الرواتب */}
        {selectedReport === 'salaries' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">الشهر / السنة</th>
                  <th className="p-3">الأساسي</th>
                  <th className="p-3">المكافآت</th>
                  <th className="p-3">الخصومات</th>
                  <th className="p-3">الصافي المنصرف</th>
                  <th className="p-3">تاريخ الصرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {payrolls
                  .filter((p) => employeeFilter === 'ALL' || p.employeeId === employeeFilter)
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-white">{p.employeeName}</td>
                      <td className="p-3 font-bold text-white tabular-nums">
                        {p.month} / {p.year}
                      </td>
                      <td className="p-3 tabular-nums">
                        {formatCurrency(p.basicSalary, settings.currencySymbol)}
                      </td>
                      <td className="p-3 text-emerald-400 tabular-nums">
                        +{formatCurrency(p.bonuses, settings.currencySymbol)}
                      </td>
                      <td className="p-3 text-red-400 tabular-nums">
                        -{formatCurrency(p.deductions, settings.currencySymbol)}
                      </td>
                      <td className="p-3 font-bold text-[#007BFF] tabular-nums">
                        {formatCurrency(p.netSalary, settings.currencySymbol)}
                      </td>
                      <td className="p-3 text-[#888888] tabular-nums">
                        {formatDate(p.paymentDate)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 11. تقرير المنتجات تحت التشغيل */}
        {selectedReport === 'wip' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم المنتج</th>
                  <th className="p-3">الكود</th>
                  <th className="p-3">الكمية المطلوبة</th>
                  <th className="p-3">الكمية المنجزة</th>
                  <th className="p-3">تكلفة الإنتاج</th>
                  <th className="p-3">المواد الخام</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {workInProgress.map((wip) => (
                  <tr key={wip.id}>
                    <td className="p-3 font-bold text-white">{wip.name}</td>
                    <td className="p-3 text-[#007BFF] font-mono tabular-nums">{wip.code}</td>
                    <td className="p-3 tabular-nums">{wip.requiredQty}</td>
                    <td className="p-3 font-bold text-emerald-400 tabular-nums">
                      {wip.completedQty}
                    </td>
                    <td className="p-3 font-bold tabular-nums">
                      {formatCurrency(wip.productionCost, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-[#B0B0B0]">{wip.rawMaterialsUsed || '-'}</td>
                    <td className="p-3 text-[#007BFF] font-semibold">{wip.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 12. تقرير المنتجات التامة */}
        {selectedReport === 'finished_products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">اسم المنتج التام</th>
                  <th className="p-3">الكود</th>
                  <th className="p-3">الكمية المتاحة</th>
                  <th className="p-3">تكلفة الوحدة</th>
                  <th className="p-3">سعر البيع</th>
                  <th className="p-3">إجمالي القيمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {finishedProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 text-[#007BFF] font-mono tabular-nums">{p.code}</td>
                    <td className="p-3 font-bold text-emerald-400 tabular-nums">
                      {p.availableQty} قطعة
                    </td>
                    <td className="p-3 tabular-nums">
                      {formatCurrency(p.manufacturingCost, settings.currencySymbol)}
                    </td>
                    <td className="p-3 font-bold text-white tabular-nums">
                      {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                    </td>
                    <td className="p-3 font-bold text-white tabular-nums">
                      {formatCurrency(
                        p.totalValue || p.availableQty * p.sellingPrice,
                        settings.currencySymbol
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 13. تقرير السحوبات */}
        {selectedReport === 'withdrawals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">المبلغ المسحوب</th>
                  <th className="p-3">المسؤول / الشريك</th>
                  <th className="p-3">سبب السحب</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="p-3 font-bold text-white tabular-nums">
                      {formatCurrency(w.amount, settings.currencySymbol)}
                    </td>
                    <td className="p-3 font-semibold text-white">{w.responsible}</td>
                    <td className="p-3 text-[#B0B0B0]">{w.reason}</td>
                    <td className="p-3 text-[#888888] tabular-nums">{formatDate(w.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 14. تقرير رأس المال */}
        {selectedReport === 'capital' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">البيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {capitalTransactions.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-white">{c.type}</td>
                    <td className="p-3 font-bold text-white tabular-nums">
                      {formatCurrency(c.amount, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-white">{c.responsible}</td>
                    <td className="p-3 text-[#888888] tabular-nums">{formatDate(c.date)}</td>
                    <td className="p-3 text-[#B0B0B0]">{c.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Official Footer */}
        <div className="pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between text-xs text-[#888888] gap-4">
          <div>
            تم استخراج هذا التقرير آلياً بواسطة نظام إدارة المصنع <strong>Factory Data</strong>
          </div>
          <div className="flex items-center gap-8">
            <div>توقيع المسؤول المالي: ........................</div>
            <div>اعتماد مدير المصنع: ........................</div>
          </div>
        </div>
      </div>
    </div>
  );
};
