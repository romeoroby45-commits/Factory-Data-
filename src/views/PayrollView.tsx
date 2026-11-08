import React, { useState, useMemo } from 'react';
import {
  Wallet,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Trash2,
  MessageCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { Deduction, Bonus, PayrollRecord } from '../types';
import {
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
  buildDeductionWhatsAppMessage,
  buildPayslipWhatsAppMessage,
} from '../utils/helpers';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const PayrollView: React.FC = () => {
  const {
    employees,
    deductions,
    bonuses,
    payrolls,
    addDeduction,
    deleteDeduction,
    addBonus,
    deleteBonus,
    addPayroll,
    deletePayroll,
    settings,
  } = useFactory();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'payroll_sheet' | 'deductions' | 'bonuses' | 'history'>('payroll_sheet');

  // Month & Year selection (current date as default)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [searchEmployee, setSearchEmployee] = useState('');

  // Modals
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    id: string;
    type: 'deduction' | 'bonus' | 'payroll';
  } | null>(null);

  // WhatsApp Modal
  const [whatsAppData, setWhatsAppData] = useState<{
    isOpen: boolean;
    name: string;
    code: string;
    phone: string;
    message: string;
  }>({
    isOpen: false,
    name: '',
    code: '+20',
    phone: '',
    message: '',
  });

  // Deduction Form State
  const [deductionForm, setDeductionForm] = useState({
    employeeId: '',
    amount: 100,
    reason: '',
    date: getTodayDateString(),
    responsible: 'إدارة المصنع',
    notes: '',
  });

  // Bonus Form State
  const [bonusForm, setBonusForm] = useState({
    employeeId: '',
    amount: 200,
    reason: '',
    date: getTodayDateString(),
    responsible: 'إدارة المصنع',
    notes: '',
  });

  // Open deduction modal for an employee
  const handleOpenDeduction = (employeeId?: string) => {
    setDeductionForm({
      employeeId: employeeId || (employees[0]?.id ?? ''),
      amount: 100,
      reason: 'غياب بدون إذن',
      date: getTodayDateString(),
      responsible: 'إدارة المصنع',
      notes: '',
    });
    setIsDeductionModalOpen(true);
  };

  // Open bonus modal for an employee
  const handleOpenBonus = (employeeId?: string) => {
    setBonusForm({
      employeeId: employeeId || (employees[0]?.id ?? ''),
      amount: 200,
      reason: 'مكافأة إنتاجية والتزام',
      date: getTodayDateString(),
      responsible: 'إدارة المصنع',
      notes: '',
    });
    setIsBonusModalOpen(true);
  };

  // Save Deduction & auto-trigger WhatsApp preview
  const handleSaveDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === deductionForm.employeeId);
    if (!emp) {
      alert('يرجى اختيار الموظف أولاً');
      return;
    }

    const deductionDate = new Date(deductionForm.date);
    const month = deductionDate.getMonth() + 1;
    const year = deductionDate.getFullYear();

    const newDeduction: Deduction = {
      id: generateId(),
      employeeId: emp.id,
      employeeName: emp.name,
      amount: Number(deductionForm.amount) || 0,
      reason: deductionForm.reason.trim(),
      date: deductionForm.date,
      responsible: deductionForm.responsible.trim(),
      notes: deductionForm.notes.trim() || undefined,
      month,
      year,
      createdAt: new Date().toISOString(),
    };

    await addDeduction(newDeduction);
    setIsDeductionModalOpen(false);

    // Compute updated total deductions for the month to prepare the WhatsApp message
    const previousDeductions = deductions
      .filter((d) => d.employeeId === emp.id && d.month === month && d.year === year)
      .reduce((a, b) => a + b.amount, 0);

    const updatedTotalDeductions = previousDeductions + newDeduction.amount;
    const estimatedNet = Math.max(0, emp.basicSalary - updatedTotalDeductions);

    // Generate WhatsApp notification immediately for preview & sending
    const msg = buildDeductionWhatsAppMessage({
      employeeName: emp.name,
      deductionAmount: newDeduction.amount,
      reason: newDeduction.reason,
      date: newDeduction.date,
      basicSalary: emp.basicSalary,
      totalDeductions: updatedTotalDeductions,
      netSalary: estimatedNet,
      factoryName: settings.factoryName,
    });

    setWhatsAppData({
      isOpen: true,
      name: emp.name,
      code: emp.countryCode || '+20',
      phone: emp.phone,
      message: msg,
    });
  };

  // Save Bonus
  const handleSaveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === bonusForm.employeeId);
    if (!emp) {
      alert('يرجى اختيار الموظف أولاً');
      return;
    }

    const bonusDate = new Date(bonusForm.date);
    const newBonus: Bonus = {
      id: generateId(),
      employeeId: emp.id,
      employeeName: emp.name,
      amount: Number(bonusForm.amount) || 0,
      reason: bonusForm.reason.trim(),
      date: bonusForm.date,
      responsible: bonusForm.responsible.trim(),
      notes: bonusForm.notes.trim() || undefined,
      month: bonusDate.getMonth() + 1,
      year: bonusDate.getFullYear(),
      createdAt: new Date().toISOString(),
    };

    await addBonus(newBonus);
    setIsBonusModalOpen(false);
  };

  // Process / Pay salary for an employee
  const handlePaySalary = async (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    // Check if already paid
    const existing = payrolls.find(
      (p) => p.employeeId === empId && p.month === selectedMonth && p.year === selectedYear
    );
    if (existing) {
      alert('تم صرف راتب هذا الشهر بالفعل لهذا الموظف');
      return;
    }

    const empDeductions = deductions
      .filter((d) => d.employeeId === empId && d.month === selectedMonth && d.year === selectedYear)
      .reduce((a, b) => a + b.amount, 0);

    const empBonuses = bonuses
      .filter((b) => b.employeeId === empId && b.month === selectedMonth && b.year === selectedYear)
      .reduce((a, b) => a + b.amount, 0);

    const netSalary = Math.max(0, emp.basicSalary + empBonuses - empDeductions);

    const payrollRecord: PayrollRecord = {
      id: generateId(),
      employeeId: emp.id,
      employeeName: emp.name,
      basicSalary: emp.basicSalary,
      bonuses: empBonuses,
      deductions: empDeductions,
      netSalary,
      month: selectedMonth,
      year: selectedYear,
      paymentDate: getTodayDateString(),
      status: 'paid',
      createdAt: new Date().toISOString(),
    };

    await addPayroll(payrollRecord);

    // Offer to send WhatsApp Payslip notification
    const slipMsg = buildPayslipWhatsAppMessage({
      employeeName: emp.name,
      basicSalary: emp.basicSalary,
      bonuses: empBonuses,
      deductions: empDeductions,
      netSalary,
      month: selectedMonth,
      year: selectedYear,
      paymentDate: payrollRecord.paymentDate,
      factoryName: settings.factoryName,
    });

    setWhatsAppData({
      isOpen: true,
      name: emp.name,
      code: emp.countryCode || '+20',
      phone: emp.phone,
      message: slipMsg,
    });
  };

  // Filtered employees for monthly payroll sheet
  const monthlyPayrollSheet = useMemo(() => {
    return employees
      .filter((e) => e.status === 'active' || e.status === 'inactive')
      .filter((e) => !searchEmployee || e.name.toLowerCase().includes(searchEmployee.toLowerCase()))
      .map((emp) => {
        const empDeductions = deductions
          .filter(
            (d) => d.employeeId === emp.id && d.month === selectedMonth && d.year === selectedYear
          )
          .reduce((a, b) => a + b.amount, 0);

        const empBonuses = bonuses
          .filter(
            (b) => b.employeeId === emp.id && b.month === selectedMonth && b.year === selectedYear
          )
          .reduce((a, b) => a + b.amount, 0);

        const netSalary = Math.max(0, emp.basicSalary + empBonuses - empDeductions);

        const paidRecord = payrolls.find(
          (p) => p.employeeId === emp.id && p.month === selectedMonth && p.year === selectedYear
        );

        return {
          employee: emp,
          basicSalary: emp.basicSalary,
          bonuses: empBonuses,
          deductions: empDeductions,
          netSalary,
          isPaid: !!paidRecord,
          paidRecord,
        };
      });
  }, [employees, deductions, bonuses, payrolls, selectedMonth, selectedYear, searchEmployee]);

  // Filtered deductions for the deductions log tab
  const filteredDeductions = useMemo(() => {
    return deductions
      .filter((d) => d.month === selectedMonth && d.year === selectedYear)
      .filter((d) => !searchEmployee || d.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [deductions, selectedMonth, selectedYear, searchEmployee]);

  // Filtered bonuses for the bonuses log tab
  const filteredBonuses = useMemo(() => {
    return bonuses
      .filter((b) => b.month === selectedMonth && b.year === selectedYear)
      .filter((b) => !searchEmployee || b.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bonuses, selectedMonth, selectedYear, searchEmployee]);

  // Calculations for current selected month
  const totalMonthBasic = monthlyPayrollSheet.reduce((a, b) => a + b.basicSalary, 0);
  const totalMonthBonuses = monthlyPayrollSheet.reduce((a, b) => a + b.bonuses, 0);
  const totalMonthDeductions = monthlyPayrollSheet.reduce((a, b) => a + b.deductions, 0);
  const totalMonthNet = monthlyPayrollSheet.reduce((a, b) => a + b.netSalary, 0);
  const totalMonthPaid = monthlyPayrollSheet
    .filter((x) => x.isPaid)
    .reduce((a, b) => a + (b.paidRecord?.netSalary || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#007BFF]" />
            إدارة الرواتب والخصومات والمكافآت
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            احتساب صافي الرواتب تلقائياً، تسجيل الخصومات، وإشعار الموظفين عبر واتساب فورياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenDeduction()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-all"
          >
            <MinusCircle className="w-4 h-4" />
            تسجيل خصم
          </button>
          <button
            type="button"
            onClick={() => handleOpenBonus()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            تسجيل مكافأة
          </button>
        </div>
      </div>

      {/* Month & Year Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#007BFF]" />
            <span className="text-xs font-bold text-white">شهر:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none focus:border-[#007BFF]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  شهر {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">سنة:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none focus:border-[#007BFF]"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#666666]" />
            <input
              type="text"
              placeholder="بحث بالاسم..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="pr-8 pl-3 py-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF]"
            />
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 p-1 bg-[#0a0a0a] border border-[#222222] rounded-lg">
          <button
            type="button"
            onClick={() => setActiveSubTab('payroll_sheet')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'payroll_sheet'
                ? 'bg-[#007BFF] text-white shadow-sm'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            كشف الرواتب
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('deductions')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'deductions'
                ? 'bg-[#007BFF] text-white shadow-sm'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            سجل الخصومات ({filteredDeductions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('bonuses')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'bonuses'
                ? 'bg-[#007BFF] text-white shadow-sm'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            سجل المكافآت ({filteredBonuses.length})
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">الرواتب الأساسية</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {formatCurrency(totalMonthBasic, settings.currencySymbol)}
          </span>
        </div>
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">إجمالي المكافآت (+)</span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">
            +{formatCurrency(totalMonthBonuses, settings.currencySymbol)}
          </span>
        </div>
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">إجمالي الخصومات (-)</span>
          <span className="text-sm font-bold text-red-400 tabular-nums">
            -{formatCurrency(totalMonthDeductions, settings.currencySymbol)}
          </span>
        </div>
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">صافي الرواتب المستحق</span>
          <span className="text-sm font-bold text-[#007BFF] tabular-nums">
            {formatCurrency(totalMonthNet, settings.currencySymbol)}
          </span>
        </div>
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg">
          <span className="text-[11px] text-[#B0B0B0] block mb-1">المنصرف الفعلي</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {formatCurrency(totalMonthPaid, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Sub-tab 1: Payroll Sheet */}
      {activeSubTab === 'payroll_sheet' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">المهنة</th>
                  <th className="p-3.5">الراتب الأساسي</th>
                  <th className="p-3.5">المكافآت (+)</th>
                  <th className="p-3.5">الخصومات (-)</th>
                  <th className="p-3.5">صافي الراتب المستحق</th>
                  <th className="p-3.5">حالة الصرف</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {monthlyPayrollSheet.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#666666]">
                      لا يوجد موظفون مسجلون للشهر المحدد.
                    </td>
                  </tr>
                ) : (
                  monthlyPayrollSheet.map((item) => (
                    <tr key={item.employee.id} className="hover:bg-[#161616] transition-colors">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {item.employee.name}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">
                        {item.employee.role}
                      </td>
                      <td className="p-3.5 tabular-nums text-white whitespace-nowrap">
                        {formatCurrency(item.basicSalary, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
                        {item.bonuses > 0
                          ? `+${formatCurrency(item.bonuses, settings.currencySymbol)}`
                          : '-'}
                      </td>
                      <td className="p-3.5 font-semibold text-red-400 tabular-nums whitespace-nowrap">
                        {item.deductions > 0
                          ? `-${formatCurrency(item.deductions, settings.currencySymbol)}`
                          : '-'}
                      </td>
                      <td className="p-3.5 font-bold text-[#007BFF] tabular-nums whitespace-nowrap">
                        {formatCurrency(item.netSalary, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {item.isPaid ? (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم الصرف ({formatDate(item.paidRecord!.paymentDate)})
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400">بانتظار الصرف</span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Deduction button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeduction(item.employee.id)}
                            className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                            title="خصم مبلغ من الراتب"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>

                          {/* Quick Bonus button */}
                          <button
                            type="button"
                            onClick={() => handleOpenBonus(item.employee.id)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-md transition-colors"
                            title="إضافة مكافأة"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Pay / Slip Button */}
                          {!item.isPaid ? (
                            <button
                              type="button"
                              onClick={() => handlePaySalary(item.employee.id)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-md transition-all shadow-sm"
                            >
                              صرف الراتب
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const slipMsg = buildPayslipWhatsAppMessage({
                                  employeeName: item.employee.name,
                                  basicSalary: item.basicSalary,
                                  bonuses: item.bonuses,
                                  deductions: item.deductions,
                                  netSalary: item.netSalary,
                                  month: selectedMonth,
                                  year: selectedYear,
                                  paymentDate: item.paidRecord!.paymentDate,
                                  factoryName: settings.factoryName,
                                });
                                setWhatsAppData({
                                  isOpen: true,
                                  name: item.employee.name,
                                  code: item.employee.countryCode || '+20',
                                  phone: item.employee.phone,
                                  message: slipMsg,
                                });
                              }}
                              className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-md transition-colors"
                              title="إرسال إشعار الصرف للموظف عبر واتساب"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Deductions Log */}
      {activeSubTab === 'deductions' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">قيمة الخصم</th>
                  <th className="p-3.5">سبب الخصم</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المسؤول عن الخصم</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredDeductions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#666666]">
                      لا توجد أي خصومات مسجلة خلال هذا الشهر.
                    </td>
                  </tr>
                ) : (
                  filteredDeductions.map((d) => (
                    <tr key={d.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {d.employeeName}
                      </td>
                      <td className="p-3.5 font-bold text-red-400 tabular-nums whitespace-nowrap">
                        -{formatCurrency(d.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-white whitespace-nowrap">{d.reason}</td>
                      <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                        {formatDate(d.date)}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{d.responsible}</td>
                      <td className="p-3.5 text-[#888888]">{d.notes || '-'}</td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Send / resend WhatsApp notice */}
                          <button
                            type="button"
                            onClick={() => {
                              const emp = employees.find((e) => e.id === d.employeeId);
                              if (emp) {
                                const msg = buildDeductionWhatsAppMessage({
                                  employeeName: emp.name,
                                  deductionAmount: d.amount,
                                  reason: d.reason,
                                  date: d.date,
                                  basicSalary: emp.basicSalary,
                                  totalDeductions: d.amount,
                                  netSalary: Math.max(0, emp.basicSalary - d.amount),
                                  factoryName: settings.factoryName,
                                });
                                setWhatsAppData({
                                  isOpen: true,
                                  name: emp.name,
                                  code: emp.countryCode || '+20',
                                  phone: emp.phone,
                                  message: msg,
                                });
                              }
                            }}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-md transition-colors"
                            title="إرسال إشعار الخصم عبر واتساب"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmData({ id: d.id, type: 'deduction' })
                            }
                            className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                            title="حذف الخصم"
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
      )}

      {/* Sub-tab 3: Bonuses Log */}
      {activeSubTab === 'bonuses' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">قيمة المكافأة</th>
                  <th className="p-3.5">السبب</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المسؤول</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredBonuses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#666666]">
                      لا توجد أي مكافآت مسجلة خلال هذا الشهر.
                    </td>
                  </tr>
                ) : (
                  filteredBonuses.map((b) => (
                    <tr key={b.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {b.employeeName}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                        +{formatCurrency(b.amount, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-white whitespace-nowrap">{b.reason}</td>
                      <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                        {formatDate(b.date)}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{b.responsible}</td>
                      <td className="p-3.5 text-[#888888]">{b.notes || '-'}</td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmData({ id: b.id, type: 'bonus' })}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                          title="حذف المكافأة"
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

      {/* Deduction Modal */}
      {isDeductionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-red-400" />
                تسجيل خصم من راتب موظف
              </h3>
              <button
                onClick={() => setIsDeductionModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeduction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">الموظف</label>
                <select
                  required
                  value={deductionForm.employeeId}
                  onChange={(e) =>
                    setDeductionForm({ ...deductionForm, employeeId: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-[#121212]">
                      {emp.name} ({emp.role}) - الراتب:{' '}
                      {formatCurrency(emp.basicSalary, settings.currencySymbol)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  قيمة الخصم ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  required
                  value={deductionForm.amount}
                  onChange={(e) =>
                    setDeductionForm({ ...deductionForm, amount: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">سبب الخصم</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: غياب بدون إذن / تأخير / تلف قطعة"
                  value={deductionForm.reason}
                  onChange={(e) =>
                    setDeductionForm({ ...deductionForm, reason: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ الخصم
                  </label>
                  <input
                    type="date"
                    required
                    value={deductionForm.date}
                    onChange={(e) =>
                      setDeductionForm({ ...deductionForm, date: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    المسؤول عن الخصم
                  </label>
                  <input
                    type="text"
                    required
                    value={deductionForm.responsible}
                    onChange={(e) =>
                      setDeductionForm({ ...deductionForm, responsible: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <input
                  type="text"
                  value={deductionForm.notes}
                  onChange={(e) =>
                    setDeductionForm({ ...deductionForm, notes: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222222] text-[11px] text-[#B0B0B0] flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  سيتم تجهيز إشعار واتساب تلقائياً فور الحفظ لإرساله للموظف بالبيانات والراتب المتبقي.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsDeductionModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm"
                >
                  تسجيل الخصم وإعداد الإشعار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Modal */}
      {isBonusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                تسجيل مكافأة / حافز لموظف
              </h3>
              <button
                onClick={() => setIsBonusModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBonus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">الموظف</label>
                <select
                  required
                  value={bonusForm.employeeId}
                  onChange={(e) => setBonusForm({ ...bonusForm, employeeId: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-[#121212]">
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  قيمة المكافأة ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  required
                  value={bonusForm.amount}
                  onChange={(e) => setBonusForm({ ...bonusForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">سبب المكافأة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إنتاجية استثنائية / عمل إضافي / التزام متميز"
                  value={bonusForm.reason}
                  onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ المكافأة
                  </label>
                  <input
                    type="date"
                    required
                    value={bonusForm.date}
                    onChange={(e) => setBonusForm({ ...bonusForm, date: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">المسؤول</label>
                  <input
                    type="text"
                    required
                    value={bonusForm.responsible}
                    onChange={(e) => setBonusForm({ ...bonusForm, responsible: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsBonusModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm"
                >
                  حفظ المكافأة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmData}
        onClose={() => setDeleteConfirmData(null)}
        onConfirm={() => {
          if (!deleteConfirmData) return;
          if (deleteConfirmData.type === 'deduction') {
            deleteDeduction(deleteConfirmData.id);
          } else if (deleteConfirmData.type === 'bonus') {
            deleteBonus(deleteConfirmData.id);
          } else {
            deletePayroll(deleteConfirmData.id);
          }
        }}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا السجل؟ سيتم تحديث الحسابات وصافي الرواتب فوراً."
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsAppData.isOpen}
        onClose={() => setWhatsAppData((prev) => ({ ...prev, isOpen: false }))}
        employeeName={whatsAppData.name}
        countryCode={whatsAppData.code}
        phone={whatsAppData.phone}
        initialMessage={whatsAppData.message}
      />
    </div>
  );
};
