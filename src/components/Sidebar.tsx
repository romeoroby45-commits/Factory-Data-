import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Wrench,
  Boxes,
  Cog,
  PackageCheck,
  Hammer,
  CircleDollarSign,
  FileSpreadsheet,
  Settings,
  X,
  Database,
  ArrowRightLeft,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  allowedRoles: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const {
    settings,
    employees,
    inventory,
    workInProgress,
    finishedProducts,
    machines,
    equipment,
  } = useFactory();

  const userRole = settings.currentUserRole || 'admin';

  // Navigation Items
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'accountant', 'inventory_manager', 'hr_manager'],
    },
    {
      id: 'employees',
      label: 'إدارة الموظفين',
      icon: Users,
      badge: employees.length,
      allowedRoles: ['admin', 'hr_manager'],
    },
    {
      id: 'payroll',
      label: 'الرواتب والخصومات',
      icon: Wallet,
      allowedRoles: ['admin', 'accountant', 'hr_manager'],
    },
    {
      id: 'equipment',
      label: 'المعدات والماكينات',
      icon: Wrench,
      badge: equipment.length + machines.length,
      allowedRoles: ['admin', 'inventory_manager'],
    },
    {
      id: 'inventory',
      label: 'مخزون المصنع والخامات',
      icon: Boxes,
      badge: inventory.length,
      allowedRoles: ['admin', 'inventory_manager'],
    },
    {
      id: 'wip',
      label: 'المنتجات تحت التشغيل',
      icon: Cog,
      badge: workInProgress.filter((w) => w.status !== 'completed').length,
      allowedRoles: ['admin', 'inventory_manager'],
    },
    {
      id: 'finished',
      label: 'المنتجات التامة والمبيعات',
      icon: PackageCheck,
      badge: finishedProducts.length,
      allowedRoles: ['admin', 'inventory_manager', 'accountant'],
    },
    {
      id: 'tools',
      label: 'المستلزمات والأدوات',
      icon: Hammer,
      allowedRoles: ['admin', 'inventory_manager'],
    },
    {
      id: 'financials',
      label: 'الحسابات ورأس المال',
      icon: CircleDollarSign,
      allowedRoles: ['admin', 'accountant'],
    },
    {
      id: 'reports',
      label: 'التقارير والطباعة',
      icon: FileSpreadsheet,
      allowedRoles: ['admin', 'accountant', 'inventory_manager', 'hr_manager'],
    },
    {
      id: 'settings',
      label: 'الإعدادات والنسخ الاحتياطي',
      icon: Settings,
      allowedRoles: ['admin', 'accountant'],
    },
  ];

  // Filter items based on current active role
  const visibleItems = navItems.filter(
    (item) => userRole === 'admin' || item.allowedRoles.includes(userRole)
  );

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-40 h-screen w-72 bg-[#000000] border-l border-[#222222] flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#007BFF] flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-blue-900/30">
              FD
            </div>
            <div>
              <div className="text-base font-extrabold text-white tracking-wide">
                Factory Data
              </div>
              <div className="text-[11px] text-[#B0B0B0]">نظام إدارة المصنع المتكامل</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-[#B0B0B0] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-[#666666] uppercase tracking-wider">
            أقسام النظام الرئيسية
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#007BFF] text-white shadow-md shadow-blue-950/50'
                    : 'text-[#B0B0B0] hover:text-white hover:bg-[#121212]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-[#888888] group-hover:text-white'
                    }`}
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-md tabular-nums font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#18181b] text-[#B0B0B0]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Storage status footer banner */}
        <div className="p-3 m-3 rounded-lg bg-[#0c0c0c] border border-[#222222]">
          <div className="flex items-center gap-2 mb-1.5">
            <Database className="w-3.5 h-3.5 text-[#007BFF]" />
            <span className="text-[11px] font-bold text-white">بياناتك محفوظة محلياً</span>
          </div>
          <p className="text-[10px] text-[#888888] leading-relaxed">
            تعمل قاعدة بيانات المصنع بالكامل على جهازك عبر IndexedDB بدون أي خادم خارجي.
          </p>
        </div>
      </aside>
    </>
  );
};
