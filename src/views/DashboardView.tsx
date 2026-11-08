import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Boxes,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileText,
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { formatCurrency, formatNumber, formatDate } from '../utils/helpers';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    metrics,
    settings,
    employees,
    machines,
    equipment,
    inventory,
    workInProgress,
    finishedProducts,
    expenses,
    revenues,
    withdrawals,
  } = useFactory();

  // Find low stock items
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.quantity <= item.minAlertQty);
  }, [inventory]);

  // Operational machines
  const workingMachines = machines.filter((m) => m.status === 'working').length;
  const maintenanceMachines = machines.filter((m) => m.status === 'maintenance').length;

  // Active WIP items
  const activeWipCount = workInProgress.filter((w) => w.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white mb-1">
            مرحباً بك في لوحة تحكم {settings.factoryName}
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            النظام يعمل بكامل طاقته ومحفوظ محلياً على هذا الجهاز · آخر تحديث الآن
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('financials')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            تسجيل حركة مالية
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] rounded-lg transition-all"
          >
            <Boxes className="w-4 h-4 text-[#007BFF]" />
            إدارة المخزون
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] rounded-lg transition-all"
          >
            <FileText className="w-4 h-4 text-[#007BFF]" />
            التقارير الشاملة
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-[#1e1307] border border-amber-900/60 rounded-xl text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-amber-300">
                تنبيه انخفاض المخزون: {lowStockItems.length} أصناف وصلت للحد الأدنى أو أقل!
              </div>
              <div className="text-xs text-amber-400/80">
                الأصناف:{' '}
                {lowStockItems
                  .slice(0, 3)
                  .map((i) => `${i.name} (المتبقي: ${i.quantity} ${i.unit})`)
                  .join(' · ')}
                {lowStockItems.length > 3 && ` و ${lowStockItems.length - 3} أصناف أخرى...`}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shrink-0"
          >
            فحص المخزون
          </button>
        </div>
      )}

      {/* Primary KPI Grid (All requested 13 core metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. إجمالي رأس المال */}
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#B0B0B0] mb-2">
            <span>رأس مال المصنع</span>
            <span className="p-1 rounded bg-[#1a1a1a] text-[#007BFF]">رأس المال</span>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
            {formatCurrency(metrics.netCapital, settings.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-[#888888] flex items-center justify-between">
            <span>الأساسي: {formatCurrency(metrics.baseCapital, settings.currencySymbol)}</span>
            <span>إضافات: {formatCurrency(metrics.capitalAdditions, settings.currencySymbol)}</span>
          </div>
        </div>

        {/* 2. إجمالي الأموال الموجودة (الرصيد النقدي الحالي) */}
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#B0B0B0] mb-2">
            <span>الأموال الموجودة (الرصيد النقدي)</span>
            <span className="p-1 rounded bg-[#1a1a1a] text-emerald-400">السيولة</span>
          </div>
          <div
            className={`text-2xl font-bold tabular-nums tracking-tight ${
              metrics.currentCashBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(metrics.currentCashBalance, settings.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-[#888888]">
            الرصيد المتاح الفعلي بالخزينة والحسابات
          </div>
        </div>

        {/* 3. صافي الأرباح والخسائر */}
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#B0B0B0] mb-2">
            <span>صافي الأرباح والخسائر</span>
            {metrics.netProfit >= 0 ? (
              <span className="flex items-center text-emerald-400 text-xs">
                <ArrowUpRight className="w-3.5 h-3.5" /> ربح
              </span>
            ) : (
              <span className="flex items-center text-red-400 text-xs">
                <ArrowDownRight className="w-3.5 h-3.5" /> خسارة
              </span>
            )}
          </div>
          <div
            className={`text-2xl font-bold tabular-nums tracking-tight ${
              metrics.netProfit >= 0 ? 'text-white' : 'text-red-400'
            }`}
          >
            {formatCurrency(metrics.netProfit, settings.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-[#888888]">
            الإيرادات - المصروفات التشغيلية
          </div>
        </div>

        {/* 4. إجمالي قيمة المخزون */}
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#B0B0B0] mb-2">
            <span>إجمالي قيمة المخزون</span>
            <span className="p-1 rounded bg-[#1a1a1a] text-[#007BFF]">{inventory.length} صنف</span>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
            {formatCurrency(metrics.totalInventoryValuation, settings.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-[#888888]">
            قيمة الخامات والمستلزمات الحالية
          </div>
        </div>
      </div>

      {/* Secondary Financial Indicators Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* إجمالي الإيرادات */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <div className="text-[11px] text-[#B0B0B0] mb-1">إجمالي الإيرادات</div>
          <div className="text-base font-bold text-emerald-400 tabular-nums">
            {formatCurrency(metrics.totalRevenue, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">{revenues.length} عملية</div>
        </div>

        {/* إجمالي المصروفات */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <div className="text-[11px] text-[#B0B0B0] mb-1">إجمالي المصروفات</div>
          <div className="text-base font-bold text-red-400 tabular-nums">
            {formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">{expenses.length} عملية</div>
        </div>

        {/* إجمالي الرواتب */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <div className="text-[11px] text-[#B0B0B0] mb-1">إجمالي الرواتب المصروفة</div>
          <div className="text-base font-bold text-white tabular-nums">
            {formatCurrency(metrics.totalSalariesPaid, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">مسجلة بالدفاتر</div>
        </div>

        {/* إجمالي الخصومات */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <div className="text-[11px] text-[#B0B0B0] mb-1">إجمالي الخصومات</div>
          <div className="text-base font-bold text-amber-400 tabular-nums">
            {formatCurrency(metrics.totalDeductions, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">تم خصمها من الرواتب</div>
        </div>

        {/* إجمالي السحوبات */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <div className="text-[11px] text-[#B0B0B0] mb-1">إجمالي السحوبات</div>
          <div className="text-base font-bold text-white tabular-nums">
            {formatCurrency(metrics.totalWithdrawals, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">{withdrawals.length} سحب شركاء</div>
        </div>

        {/* إجمالي قيمة الأصول والمعدات */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <div className="text-[11px] text-[#B0B0B0] mb-1">قيمة المعدات والماكينات</div>
          <div className="text-base font-bold text-white tabular-nums">
            {formatCurrency(metrics.totalEquipmentValuation, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">أصول ثابتة</div>
        </div>
      </div>

      {/* Production & Operational Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* الموظفين */}
        <div
          onClick={() => onNavigate('employees')}
          className="p-4 bg-[#121212] border border-[#222222] hover:border-[#007BFF] rounded-xl cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs text-[#B0B0B0]">عدد الموظفين</div>
            <div className="text-xl font-bold text-white tabular-nums mt-1">
              {employees.length} موظف
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {employees.filter((e) => e.status === 'active').length} موظف نشط
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#007BFF]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* المعدات والماكينات */}
        <div
          onClick={() => onNavigate('equipment')}
          className="p-4 bg-[#121212] border border-[#222222] hover:border-[#007BFF] rounded-xl cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs text-[#B0B0B0]">المعدات والماكينات</div>
            <div className="text-xl font-bold text-white tabular-nums mt-1">
              {machines.length + equipment.length} جهاز
            </div>
            <div className="text-[11px] text-[#B0B0B0] mt-1">
              {workingMachines} ماكينة تعمل · {maintenanceMachines} صيانة
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#007BFF]">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* المنتجات تحت التشغيل */}
        <div
          onClick={() => onNavigate('wip')}
          className="p-4 bg-[#121212] border border-[#222222] hover:border-[#007BFF] rounded-xl cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs text-[#B0B0B0]">تحت التشغيل (WIP)</div>
            <div className="text-xl font-bold text-white tabular-nums mt-1">
              {activeWipCount} أمر إنتاج
            </div>
            <div className="text-[11px] text-amber-400 mt-1">قيد التصنيع حالياً</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* المنتجات التامة */}
        <div
          onClick={() => onNavigate('finished')}
          className="p-4 bg-[#121212] border border-[#222222] hover:border-[#007BFF] rounded-xl cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs text-[#B0B0B0]">المنتجات التامة</div>
            <div className="text-xl font-bold text-white tabular-nums mt-1">
              {finishedProducts.length} صنف تام
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">جاهز للتسليم والبيع</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Ledger / Comparison Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Flow Summary */}
        <div className="p-5 bg-[#121212] border border-[#222222] rounded-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222222]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#007BFF]" />
              ميزان حركة الأموال التشغيلية
            </h3>
            <span className="text-xs text-[#B0B0B0]">حسابات دقيقة من قاعدة البيانات</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#B0B0B0]">الإيرادات المحصلة</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {formatCurrency(metrics.totalRevenue, settings.currencySymbol)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${
                      metrics.totalRevenue + metrics.totalExpenses > 0
                        ? Math.min(
                            100,
                            (metrics.totalRevenue /
                              (metrics.totalRevenue + metrics.totalExpenses)) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#B0B0B0]">المصروفات المنفقة</span>
                <span className="text-red-400 font-bold tabular-nums">
                  {formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${
                      metrics.totalRevenue + metrics.totalExpenses > 0
                        ? Math.min(
                            100,
                            (metrics.totalExpenses /
                              (metrics.totalRevenue + metrics.totalExpenses)) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#B0B0B0]">قيمة المخزون مقارنة برأس المال</span>
                <span className="text-[#007BFF] font-bold tabular-nums">
                  {formatCurrency(metrics.totalInventoryValuation, settings.currencySymbol)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007BFF] rounded-full"
                  style={{
                    width: `${
                      metrics.netCapital > 0
                        ? Math.min(100, (metrics.totalInventoryValuation / metrics.netCapital) * 100)
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
              <span className="text-white font-bold">صافي الموقف المالي للمصنع:</span>
              <span
                className={`text-sm font-extrabold tabular-nums ${
                  metrics.currentCashBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {metrics.currentCashBalance >= 0 ? '+ ' : ''}
                {formatCurrency(metrics.currentCashBalance, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Financial & Production Ledger */}
        <div className="p-5 bg-[#121212] border border-[#222222] rounded-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222222]">
            <h3 className="text-sm font-bold text-white">آخر الحركات المسجلة بالمصنع</h3>
            <button
              onClick={() => onNavigate('financials')}
              className="text-xs text-[#007BFF] hover:underline"
            >
              عرض السجل الكامل
            </button>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {expenses.length === 0 && revenues.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#666666]">
                لم يتم تسجيل أي حركات بعد. يمكنك البدء بإضافة رأس المال أو تسجيل المصروفات والإيرادات.
              </div>
            ) : (
              [
                ...revenues.map((r) => ({
                  type: 'rev',
                  title: r.source,
                  amount: r.amount,
                  date: r.date,
                  client: r.clientName,
                })),
                ...expenses.map((e) => ({
                  type: 'exp',
                  title: e.title,
                  amount: e.amount,
                  date: e.date,
                  category: e.category,
                })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.type === 'rev' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-[10px] text-[#888888]">{formatDate(item.date)}</div>
                      </div>
                    </div>
                    <div
                      className={`font-bold tabular-nums ${
                        item.type === 'rev' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {item.type === 'rev' ? '+' : '-'} {formatCurrency(item.amount, settings.currencySymbol)}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
