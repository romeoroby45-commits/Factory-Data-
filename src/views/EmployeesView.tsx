import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  Eye,
  FileText,
  DollarSign,
  Briefcase,
  Calendar,
  CreditCard,
  X,
  CheckCircle,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { Employee } from '../types';
import {
  COUNTRY_CODES,
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
  cleanPhoneNumber,
} from '../utils/helpers';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { ConfirmModal } from '../components/ConfirmModal';

const COMMON_ROLES = [
  'مهندس إنتاج',
  'مهندس صيانة',
  'فني تشغيل ماكينات',
  'فني كهرباء وميكانيكا',
  'عامل إنتاج',
  'عامل تشطيب وتعبئة',
  'أمين مخزن',
  'محاسب مالي',
  'مدير مصنع',
  'مشرف خط إنتاج',
  'سائق نقل وتوريدات',
  'مسؤول جودة',
  'أخرى',
];

export const EmployeesView: React.FC = () => {
  const { employees, deductions, payrolls, addEmployee, updateEmployee, deleteEmployee, settings } =
    useFactory();

  // Search & Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'salary' | 'hireDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // WhatsApp Modal state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
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

  // Delete Confirm Modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    countryCode: string;
    countryFlag: string;
    nationalId: string;
    role: string;
    customRole: string;
    basicSalary: number;
    hireDate: string;
    status: 'active' | 'inactive';
    notes: string;
  }>({
    name: '',
    phone: '',
    countryCode: '+20',
    countryFlag: '🇪🇬',
    nationalId: '',
    role: 'عامل إنتاج',
    customRole: '',
    basicSalary: 4000,
    hireDate: getTodayDateString(),
    status: 'active',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      phone: '',
      countryCode: '+20',
      countryFlag: '🇪🇬',
      nationalId: '',
      role: 'عامل إنتاج',
      customRole: '',
      basicSalary: 4000,
      hireDate: getTodayDateString(),
      status: 'active',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    const isStandardRole = COMMON_ROLES.includes(emp.role);
    setFormData({
      name: emp.name,
      phone: emp.phone,
      countryCode: emp.countryCode || '+20',
      countryFlag: emp.countryFlag || '🇪🇬',
      nationalId: emp.nationalId || '',
      role: isStandardRole ? emp.role : 'أخرى',
      customRole: isStandardRole ? '' : emp.role,
      basicSalary: emp.basicSalary,
      hireDate: emp.hireDate,
      status: emp.status,
      notes: emp.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleCountryChange = (code: string) => {
    const found = COUNTRY_CODES.find((c) => c.code === code);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        countryCode: found.code,
        countryFlag: found.flag,
      }));
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('يرجى كتابة اسم الموظف ورقم الهاتف');
      return;
    }

    const actualRole =
      formData.role === 'أخرى' && formData.customRole.trim()
        ? formData.customRole.trim()
        : formData.role;

    if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        countryCode: formData.countryCode,
        countryFlag: formData.countryFlag,
        nationalId: formData.nationalId.trim() || undefined,
        role: actualRole,
        basicSalary: Number(formData.basicSalary) || 0,
        hireDate: formData.hireDate,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };
      await updateEmployee(updated);
    } else {
      const newEmp: Employee = {
        id: generateId(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        countryCode: formData.countryCode,
        countryFlag: formData.countryFlag,
        nationalId: formData.nationalId.trim() || undefined,
        role: actualRole,
        basicSalary: Number(formData.basicSalary) || 0,
        hireDate: formData.hireDate,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await addEmployee(newEmp);
    }

    setIsFormOpen(false);
  };

  // Open WhatsApp Quick Chat
  const handleOpenWhatsApp = (emp: Employee) => {
    const defaultMsg = `السلام عليكم أ/ ${emp.name}،
تحية طيبة من إدارة مصنع ${settings.factoryName}.
نود التواصل معكم بخصوص العمل.
شكراً لكم.`;

    setWhatsAppModalData({
      isOpen: true,
      name: emp.name,
      code: emp.countryCode || '+20',
      phone: emp.phone,
      message: defaultMsg,
    });
  };

  // Filtered & Sorted employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesSearch =
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.phone.includes(searchTerm) ||
          (emp.nationalId && emp.nationalId.includes(searchTerm));

        const matchesRole =
          selectedRoleFilter === 'ALL' || emp.role === selectedRoleFilter;

        const matchesStatus =
          selectedStatusFilter === 'ALL' || emp.status === selectedStatusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return sortOrder === 'asc'
            ? a.name.localeCompare(b.name, 'ar')
            : b.name.localeCompare(a.name, 'ar');
        } else if (sortBy === 'salary') {
          return sortOrder === 'asc'
            ? a.basicSalary - b.basicSalary
            : b.basicSalary - a.basicSalary;
        } else {
          return sortOrder === 'asc'
            ? new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime()
            : new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime();
        }
      });
  }, [employees, searchTerm, selectedRoleFilter, selectedStatusFilter, sortBy, sortOrder]);

  // Employee details data
  const employeeDeductions = useMemo(() => {
    if (!viewingEmployee) return [];
    return deductions.filter((d) => d.employeeId === viewingEmployee.id);
  }, [viewingEmployee, deductions]);

  const employeePayrolls = useMemo(() => {
    if (!viewingEmployee) return [];
    return payrolls.filter((p) => p.employeeId === viewingEmployee.id);
  }, [viewingEmployee, payrolls]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#007BFF]" />
            إدارة موظفي المصنع
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            تسجيل وإدارة بيانات العاملين، الرواتب، وسجلات الخصم والتواصل عبر واتساب
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          إضافة موظف جديد
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-[#666666]" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-[#121212] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF]"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 bg-[#121212] border border-[#27272a] rounded-lg px-3 py-2">
          <Briefcase className="w-4 h-4 text-[#007BFF] shrink-0" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-[#121212]">
              جميع المهن والأقسام
            </option>
            {COMMON_ROLES.map((r) => (
              <option key={r} value={r} className="bg-[#121212]">
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-[#121212] border border-[#27272a] rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-[#007BFF] shrink-0" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-[#121212]">
              كل الحالات
            </option>
            <option value="active" className="bg-[#121212]">
              الموظفون النشطون
            </option>
            <option value="inactive" className="bg-[#121212]">
              غير النشطين
            </option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 bg-[#121212] border border-[#27272a] rounded-lg px-3 py-2">
          <ArrowUpDown className="w-4 h-4 text-[#007BFF] shrink-0" />
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="name_asc" className="bg-[#121212]">
              الاسم (أ - ي)
            </option>
            <option value="name_desc" className="bg-[#121212]">
              الاسم (ي - أ)
            </option>
            <option value="salary_desc" className="bg-[#121212]">
              الراتب (الأعلى أولاً)
            </option>
            <option value="salary_asc" className="bg-[#121212]">
              الراتب (الأقل أولاً)
            </option>
            <option value="hireDate_desc" className="bg-[#121212]">
              الأحدث تعييناً
            </option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs table-dark">
            <thead>
              <tr>
                <th className="p-3.5">اسم الموظف</th>
                <th className="p-3.5">الهاتف والتواصل</th>
                <th className="p-3.5">المهنة / التخصص</th>
                <th className="p-3.5">الراتب الأساسي</th>
                <th className="p-3.5">تاريخ التعيين</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#666666]">
                    لا يوجد موظفون مطابقون لخيارات البحث. اضغط على "إضافة موظف جديد" للبدء.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#161616] transition-colors">
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {emp.name}
                      {emp.nationalId && (
                        <span className="block text-[10px] text-[#888888] font-normal">
                          الرقم القومي: {emp.nationalId}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{emp.countryFlag || '🇪🇬'}</span>
                        <span className="tabular-nums text-white">
                          {emp.countryCode || '+20'} {emp.phone}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(emp)}
                          className="p-1 rounded-md bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/40 transition-colors"
                          title="محادثة واتساب مباشرة"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-white whitespace-nowrap">{emp.role}</td>
                    <td className="p-3.5 font-bold text-[#007BFF] tabular-nums whitespace-nowrap">
                      {formatCurrency(emp.basicSalary, settings.currencySymbol)}
                    </td>
                    <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">
                      {formatDate(emp.hireDate)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`text-xs ${
                          emp.status === 'active' ? 'text-emerald-400' : 'text-[#888888]'
                        }`}
                      >
                        {emp.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingEmployee(emp)}
                          className="p-1.5 text-[#B0B0B0] hover:text-white hover:bg-[#222222] rounded-md transition-colors"
                          title="عرض التفاصيل وسجل الرواتب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-[#007BFF] hover:bg-[#1a2536] rounded-md transition-colors"
                          title="تعديل البيانات"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(emp.id)}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                          title="حذف الموظف"
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

      {/* Add / Edit Employee Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white">
                {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد للمصنع'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1f1f1f]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                  اسم الموظف بالكامل <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود إبراهيم"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              {/* Phone with Country Code & Flag */}
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                  رقم الهاتف (مصر 🇪🇬 +20 افتراضياً مع إمكانية التغيير) <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-36 p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] shrink-0 cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#121212]">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="01012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="flex-1 p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] text-left tabular-nums"
                  />
                </div>
              </div>

              {/* National ID (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                  رقم البطاقة الشخصية / القومي (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="14 رقم"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                />
              </div>

              {/* Role & Profession */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                    المهنة / التخصص بالمصنع
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] cursor-pointer"
                  >
                    {COMMON_ROLES.map((r) => (
                      <option key={r} value={r} className="bg-[#121212]">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.role === 'أخرى' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                      حدد المسمى الوظيفي
                    </label>
                    <input
                      type="text"
                      placeholder="اكتب المسمى الوظيفي..."
                      value={formData.customRole}
                      onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                      className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                    الراتب الشهري الأساسي ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.basicSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, basicSalary: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              {/* Hire Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                    تاريخ التعيين
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                    حالة الموظف
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="active" className="bg-[#121212]">
                      نشط ويعمل
                    </option>
                    <option value="inactive" className="bg-[#121212]">
                      غير نشط (إجازة / منقطع)
                    </option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                  ملاحظات إضافية
                </label>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات حول الموظف أو أرقام طوارئ..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white hover:bg-[#1a1a1a] rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  {editingEmployee ? 'تحديث البيانات' : 'حفظ الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Details Modal with Full Salary & Deduction History */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#007BFF] flex items-center justify-center font-bold text-white">
                  {viewingEmployee.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{viewingEmployee.name}</h3>
                  <p className="text-xs text-[#B0B0B0]">
                    {viewingEmployee.role} · {viewingEmployee.countryFlag}{' '}
                    {viewingEmployee.countryCode} {viewingEmployee.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingEmployee(null)}
                className="p-1 text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1f1f1f]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#0a0a0a] border border-[#222222] rounded-lg text-xs">
                <div>
                  <span className="text-[#888888] block mb-0.5">الراتب الأساسي</span>
                  <span className="font-bold text-[#007BFF] tabular-nums">
                    {formatCurrency(viewingEmployee.basicSalary, settings.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-0.5">تاريخ التعيين</span>
                  <span className="font-bold text-white tabular-nums">
                    {formatDate(viewingEmployee.hireDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-0.5">الحالة</span>
                  <span
                    className={`font-bold ${
                      viewingEmployee.status === 'active' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {viewingEmployee.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-0.5">الرقم القومي</span>
                  <span className="text-white tabular-nums">
                    {viewingEmployee.nationalId || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Deductions History */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                  <span>سجل الخصومات ({employeeDeductions.length})</span>
                  <span className="text-amber-400 font-normal">
                    إجمالي الخصومات:{' '}
                    {formatCurrency(
                      employeeDeductions.reduce((a, b) => a + b.amount, 0),
                      settings.currencySymbol
                    )}
                  </span>
                </h4>
                {employeeDeductions.length === 0 ? (
                  <div className="p-4 bg-[#050505] border border-[#1f1f1f] rounded-lg text-xs text-[#666666] text-center">
                    لا توجد أي خصومات مسجلة على هذا الموظف.
                  </div>
                ) : (
                  <div className="border border-[#222222] rounded-lg overflow-hidden">
                    <table className="w-full text-right text-xs table-dark">
                      <thead>
                        <tr>
                          <th className="p-2.5">المبلغ</th>
                          <th className="p-2.5">السبب</th>
                          <th className="p-2.5">التاريخ</th>
                          <th className="p-2.5">المسؤول</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1e1e]">
                        {employeeDeductions.map((d) => (
                          <tr key={d.id}>
                            <td className="p-2.5 font-bold text-red-400 tabular-nums">
                              -{formatCurrency(d.amount, settings.currencySymbol)}
                            </td>
                            <td className="p-2.5 text-white">{d.reason}</td>
                            <td className="p-2.5 text-[#B0B0B0] tabular-nums">
                              {formatDate(d.date)}
                            </td>
                            <td className="p-2.5 text-[#888888]">{d.responsible}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payroll History */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2">سجل صرف الرواتب</h4>
                {employeePayrolls.length === 0 ? (
                  <div className="p-4 bg-[#050505] border border-[#1f1f1f] rounded-lg text-xs text-[#666666] text-center">
                    لم يتم تسجيل صرف رواتب سابقة حتى الآن.
                  </div>
                ) : (
                  <div className="border border-[#222222] rounded-lg overflow-hidden">
                    <table className="w-full text-right text-xs table-dark">
                      <thead>
                        <tr>
                          <th className="p-2.5">الفترة</th>
                          <th className="p-2.5">الأساسي</th>
                          <th className="p-2.5">المكافآت</th>
                          <th className="p-2.5">الخصومات</th>
                          <th className="p-2.5">الصافي المنصرف</th>
                          <th className="p-2.5">تاريخ الصرف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1e1e]">
                        {employeePayrolls.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2.5 font-bold text-white">
                              {p.month} / {p.year}
                            </td>
                            <td className="p-2.5 tabular-nums">
                              {formatCurrency(p.basicSalary, settings.currencySymbol)}
                            </td>
                            <td className="p-2.5 text-emerald-400 tabular-nums">
                              +{formatCurrency(p.bonuses, settings.currencySymbol)}
                            </td>
                            <td className="p-2.5 text-red-400 tabular-nums">
                              -{formatCurrency(p.deductions, settings.currencySymbol)}
                            </td>
                            <td className="p-2.5 font-bold text-[#007BFF] tabular-nums">
                              {formatCurrency(p.netSalary, settings.currencySymbol)}
                            </td>
                            <td className="p-2.5 text-[#888888] tabular-nums">
                              {formatDate(p.paymentDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#222222] bg-[#0a0a0a]">
              <button
                type="button"
                onClick={() => {
                  handleOpenWhatsApp(viewingEmployee);
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/40 rounded-lg"
              >
                <MessageCircle className="w-4 h-4" />
                مراسلة الموظف عبر واتساب
              </button>
              <button
                type="button"
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteEmployee(deleteConfirmId);
        }}
        title="تأكيد حذف الموظف"
        message="هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف بياناته وسجلاته محلياً من النظام."
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalData.isOpen}
        onClose={() => setWhatsAppModalData((prev) => ({ ...prev, isOpen: false }))}
        employeeName={whatsAppModalData.name}
        countryCode={whatsAppModalData.code}
        phone={whatsAppModalData.phone}
        initialMessage={whatsAppModalData.message}
      />
    </div>
  );
};
