import React from 'react';
import { ShieldCheck, HardDrive, Menu, User, Sparkles } from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: string;
  onToggleMobileMenu: () => void;
  onOpenQuickBackup?: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'لوحة التحكم الرئيسية',
  employees: 'إدارة الموظفين',
  payroll: 'الرواتب والخصومات',
  equipment: 'إدارة المعدات والماكينات',
  inventory: 'إدارة مخزون المصنع',
  wip: 'المنتجات تحت التشغيل',
  finished: 'المنتجات التامة والمبيعات',
  tools: 'المستلزمات والأدوات',
  financials: 'رأس المال والحسابات المالية',
  reports: 'التقارير الشاملة والطباعة',
  settings: 'إعدادات النظام والنسخ الاحتياطي',
};

const ROLES: { id: UserRole; title: string }[] = [
  { id: 'admin', title: 'المدير العام (كافة الصلاحيات)' },
  { id: 'accountant', title: 'المحاسب (المالية والرواتب)' },
  { id: 'inventory_manager', title: 'مسؤول المخزون والإنتاج' },
  { id: 'hr_manager', title: 'مسؤول الموظفين والرواتب' },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, onToggleMobileMenu }) => {
  const { settings, switchUserRole } = useFactory();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3.5 bg-[#000000] border-b border-[#222222]">
      {/* Zone 1: Mobile Hamburger & Brand Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#121212] transition-colors"
          aria-label="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#007BFF] flex items-center justify-center font-bold text-white shadow-sm">
            FD
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            {settings.factoryName || 'Factory Data'}
          </span>
        </div>
      </div>

      {/* Zone 2: Active Section & Offline Security Indicator */}
      <div className="hidden md:flex items-center gap-3">
        <span className="text-sm font-semibold text-white">
          {TAB_TITLES[activeTab] || 'النظام'}
        </span>
        <span className="text-[#444444]">·</span>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-[#0a160d] border border-emerald-900/40 px-2.5 py-1 rounded-md">
          <HardDrive className="w-3.5 h-3.5" />
          <span>تخزين محلي 100% على هذا الجهاز فقط</span>
        </div>
      </div>

      {/* Zone 3: Role Switcher & System Indicator */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-[#121212] border border-[#27272a] rounded-lg px-2.5 py-1.5">
          <User className="w-4 h-4 text-[#007BFF]" />
          <select
            value={settings.currentUserRole}
            onChange={(e) => switchUserRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
          >
            {ROLES.map((role) => (
              <option key={role.id} value={role.id} className="bg-[#121212] text-white">
                {role.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
