import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Cog,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Upload,
  Image as ImageIcon,
  X,
  History,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { Equipment, Machine, MachineMaintenance, MachineStatus } from '../types';
import {
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
  fileToBase64,
} from '../utils/helpers';
import { ConfirmModal } from '../components/ConfirmModal';

const MACHINE_STATUS_CONFIG: Record<
  MachineStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  working: {
    label: 'تعمل بكفاءة',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-900/60',
  },
  maintenance: {
    label: 'تحتاج إلى صيانة',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-900/60',
  },
  stopped: {
    label: 'متوقفة مؤقتاً',
    color: 'text-blue-400',
    bg: 'bg-blue-950/40',
    border: 'border-blue-900/60',
  },
  out_of_service: {
    label: 'خارج الخدمة',
    color: 'text-red-400',
    bg: 'bg-red-950/40',
    border: 'border-red-900/60',
  },
};

export const EquipmentMachineryView: React.FC = () => {
  const {
    equipment,
    machines,
    maintenances,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addMachine,
    updateMachine,
    deleteMachine,
    addMaintenance,
    deleteMaintenance,
    settings,
  } = useFactory();

  const [activeTab, setActiveTab] = useState<'machines' | 'equipment' | 'maintenance'>('machines');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedMachineForMaint, setSelectedMachineForMaint] = useState<string>('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    id: string;
    type: 'machine' | 'equipment' | 'maintenance';
  } | null>(null);

  // Machine Form
  const [machineForm, setMachineForm] = useState<{
    name: string;
    code: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
    status: MachineStatus;
    department: string;
    notes: string;
  }>({
    name: '',
    code: '',
    quantity: 1,
    purchasePrice: 50000,
    purchaseDate: getTodayDateString(),
    status: 'working',
    department: 'خط الإنتاج الرئيسي',
    notes: '',
  });

  // Equipment Form
  const [equipmentForm, setEquipmentForm] = useState<{
    name: string;
    code: string;
    quantity: number;
    unitPrice: number;
    purchaseDate: string;
    status: 'excellent' | 'good' | 'needs_maintenance' | 'out_of_service';
    location: string;
    notes: string;
    imageUrl?: string;
  }>({
    name: '',
    code: '',
    quantity: 1,
    unitPrice: 5000,
    purchaseDate: getTodayDateString(),
    status: 'excellent',
    location: 'ورشه التجميع',
    notes: '',
    imageUrl: '',
  });

  // Maintenance Form
  const [maintenanceForm, setMaintenanceForm] = useState({
    machineId: '',
    date: getTodayDateString(),
    description: 'صيانة دورية وتغيير زيوت وفلاتر',
    cost: 1500,
    technician: 'المهندس المسؤول / شركة الصيانة',
    notes: '',
  });

  // Handle open Machine Form
  const handleOpenMachineAdd = () => {
    setEditingMachine(null);
    setMachineForm({
      name: '',
      code: `MAC-${Math.floor(100 + Math.random() * 900)}`,
      quantity: 1,
      purchasePrice: 50000,
      purchaseDate: getTodayDateString(),
      status: 'working',
      department: 'خط الإنتاج الرئيسي',
      notes: '',
    });
    setIsMachineModalOpen(true);
  };

  const handleOpenMachineEdit = (m: Machine) => {
    setEditingMachine(m);
    setMachineForm({
      name: m.name,
      code: m.code,
      quantity: m.quantity || 1,
      purchasePrice: m.purchasePrice,
      purchaseDate: m.purchaseDate,
      status: m.status,
      department: m.department,
      notes: m.notes || '',
    });
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineForm.name.trim()) return;

    if (editingMachine) {
      await updateMachine({
        ...editingMachine,
        name: machineForm.name.trim(),
        code: machineForm.code.trim(),
        quantity: Number(machineForm.quantity) || 1,
        purchasePrice: Number(machineForm.purchasePrice) || 0,
        purchaseDate: machineForm.purchaseDate,
        status: machineForm.status,
        department: machineForm.department.trim(),
        notes: machineForm.notes.trim() || undefined,
      });
    } else {
      const newM: Machine = {
        id: generateId(),
        name: machineForm.name.trim(),
        code: machineForm.code.trim(),
        quantity: Number(machineForm.quantity) || 1,
        purchasePrice: Number(machineForm.purchasePrice) || 0,
        purchaseDate: machineForm.purchaseDate,
        status: machineForm.status,
        department: machineForm.department.trim(),
        notes: machineForm.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await addMachine(newM);
    }
    setIsMachineModalOpen(false);
  };

  // Equipment Save
  const handleOpenEquipmentAdd = () => {
    setEditingEquipment(null);
    setEquipmentForm({
      name: '',
      code: `EQP-${Math.floor(100 + Math.random() * 900)}`,
      quantity: 1,
      unitPrice: 5000,
      purchaseDate: getTodayDateString(),
      status: 'excellent',
      location: 'ورشة التجميع',
      notes: '',
      imageUrl: '',
    });
    setIsEquipmentModalOpen(true);
  };

  const handleOpenEquipmentEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEquipmentForm({
      name: eq.name,
      code: eq.code,
      quantity: eq.quantity,
      unitPrice: eq.unitPrice,
      purchaseDate: eq.purchaseDate,
      status: eq.status,
      location: eq.location,
      notes: eq.notes || '',
      imageUrl: eq.imageUrl || '',
    });
    setIsEquipmentModalOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentForm.name.trim()) return;

    const totalVal = (Number(equipmentForm.quantity) || 1) * (Number(equipmentForm.unitPrice) || 0);

    if (editingEquipment) {
      await updateEquipment({
        ...editingEquipment,
        name: equipmentForm.name.trim(),
        code: equipmentForm.code.trim(),
        quantity: Number(equipmentForm.quantity) || 1,
        unitPrice: Number(equipmentForm.unitPrice) || 0,
        totalValue: totalVal,
        purchaseDate: equipmentForm.purchaseDate,
        status: equipmentForm.status,
        location: equipmentForm.location.trim(),
        notes: equipmentForm.notes.trim() || undefined,
        imageUrl: equipmentForm.imageUrl,
      });
    } else {
      const newEq: Equipment = {
        id: generateId(),
        name: equipmentForm.name.trim(),
        code: equipmentForm.code.trim(),
        quantity: Number(equipmentForm.quantity) || 1,
        unitPrice: Number(equipmentForm.unitPrice) || 0,
        totalValue: totalVal,
        purchaseDate: equipmentForm.purchaseDate,
        status: equipmentForm.status,
        location: equipmentForm.location.trim(),
        notes: equipmentForm.notes.trim() || undefined,
        imageUrl: equipmentForm.imageUrl,
        createdAt: new Date().toISOString(),
      };
      await addEquipment(newEq);
    }
    setIsEquipmentModalOpen(false);
  };

  // Maintenance Save
  const handleOpenMaintenance = (machineId?: string) => {
    setSelectedMachineForMaint(machineId || machines[0]?.id || '');
    setMaintenanceForm({
      machineId: machineId || machines[0]?.id || '',
      date: getTodayDateString(),
      description: 'صيانة دورية وتغيير زيوت وفلاتر',
      cost: 1500,
      technician: 'المهندس المسؤول / شركة الصيانة',
      notes: '',
    });
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMachine = machines.find((m) => m.id === maintenanceForm.machineId);
    if (!targetMachine) {
      alert('يرجى اختيار الماكينة');
      return;
    }

    const newMaint: MachineMaintenance = {
      id: generateId(),
      machineId: targetMachine.id,
      machineName: targetMachine.name,
      date: maintenanceForm.date,
      description: maintenanceForm.description.trim(),
      cost: Number(maintenanceForm.cost) || 0,
      technician: maintenanceForm.technician.trim(),
      notes: maintenanceForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addMaintenance(newMaint);

    // If machine was in maintenance, set back to working or let user know
    if (targetMachine.status === 'maintenance') {
      await updateMachine({ ...targetMachine, status: 'working' });
    }

    setIsMaintenanceModalOpen(false);
  };

  // Image Upload helper
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setEquipmentForm((prev) => ({ ...prev, imageUrl: base64 }));
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
  };

  // Filtered lists
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [machines, searchTerm, statusFilter]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      const matchSearch =
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || eq.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [equipment, searchTerm, statusFilter]);

  const totalMachinesVal = machines.reduce(
    (acc, m) => acc + m.purchasePrice * (m.quantity || 1),
    0
  );
  const totalEquipmentVal = equipment.reduce((acc, eq) => acc + (eq.totalValue || 0), 0);
  const totalMaintenanceCost = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Cog className="w-5 h-5 text-[#007BFF]" />
            إدارة المعدات والماكينات والمكن
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            متابعة الحالة التشغيلية، جدول الصيانة، والقيمة الإجمالية لأصول المصنع
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'machines' && (
            <button
              type="button"
              onClick={handleOpenMachineAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة ماكينة جديدة
            </button>
          )}

          {activeTab === 'equipment' && (
            <button
              type="button"
              onClick={handleOpenEquipmentAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة معدة جديدة
            </button>
          )}

          {activeTab === 'maintenance' && (
            <button
              type="button"
              onClick={() => handleOpenMaintenance()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all"
            >
              <Wrench className="w-4 h-4" />
              تسجيل عملية صيانة
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[#0a0a0a] border border-[#222222] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setActiveTab('machines');
                setStatusFilter('ALL');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'machines'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              الماكينات والمكن ({machines.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('equipment');
                setStatusFilter('ALL');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'equipment'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              المعدات ({equipment.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('maintenance');
                setStatusFilter('ALL');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'maintenance'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              سجل الصيانة ({maintenances.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#666666]" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 pl-3 py-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF]"
            />
          </div>

          {activeTab === 'machines' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="working">تعمل</option>
              <option value="maintenance">تحتاج لصيانة</option>
              <option value="stopped">متوقفة</option>
              <option value="out_of_service">خارج الخدمة</option>
            </select>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي قيمة الماكينات</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {formatCurrency(totalMachinesVal, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            {machines.length} ماكينة مسجلة
          </span>
        </div>

        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي قيمة المعدات</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {formatCurrency(totalEquipmentVal, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            {equipment.length} معدة مسجلة
          </span>
        </div>

        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">تكاليف الصيانة المنفقة</span>
          <span className="text-xl font-bold text-amber-400 tabular-nums">
            {formatCurrency(totalMaintenanceCost, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            {maintenances.length} عمليات صيانة مسجلة
          </span>
        </div>
      </div>

      {/* Section 1: Machines Table */}
      {activeTab === 'machines' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">اسم الماكينة</th>
                  <th className="p-3.5">رقم / كود الماكينة</th>
                  <th className="p-3.5">العدد</th>
                  <th className="p-3.5">سعر الشراء</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">الحالة التشغيلية</th>
                  <th className="p-3.5">تاريخ الشراء</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredMachines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#666666]">
                      لا توجد ماكينات مسجلة حالياً. اضغط "إضافة ماكينة جديدة" للبدء.
                    </td>
                  </tr>
                ) : (
                  filteredMachines.map((m) => {
                    const statusInfo = MACHINE_STATUS_CONFIG[m.status] || MACHINE_STATUS_CONFIG.working;
                    return (
                      <tr key={m.id} className="hover:bg-[#161616]">
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {m.name}
                          {m.notes && (
                            <span className="block text-[10px] text-[#888888] font-normal">
                              {m.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-[#007BFF] font-mono tabular-nums whitespace-nowrap">
                          {m.code}
                        </td>
                        <td className="p-3.5 text-white tabular-nums whitespace-nowrap">
                          {m.quantity || 1}
                        </td>
                        <td className="p-3.5 font-semibold text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(m.purchasePrice, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{m.department}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                          {formatDate(m.purchaseDate)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Maintenance button */}
                            <button
                              type="button"
                              onClick={() => handleOpenMaintenance(m.id)}
                              className="p-1.5 text-amber-400 hover:bg-amber-950/40 rounded-md transition-colors"
                              title="تسجيل صيانة لهذه الماكينة"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenMachineEdit(m)}
                              className="p-1.5 text-[#007BFF] hover:bg-[#1a2536] rounded-md transition-colors"
                              title="تعديل الماكينة"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmData({ id: m.id, type: 'machine' })}
                              className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                              title="حذف الماكينة"
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

      {/* Section 2: Equipment Table */}
      {activeTab === 'equipment' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">صورة</th>
                  <th className="p-3.5">اسم المعدة</th>
                  <th className="p-3.5">الكود</th>
                  <th className="p-3.5">العدد</th>
                  <th className="p-3.5">سعر الوحدة</th>
                  <th className="p-3.5">إجمالي القيمة</th>
                  <th className="p-3.5">الموقع داخل المصنع</th>
                  <th className="p-3.5">تاريخ الشراء</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-[#666666]">
                      لا توجد معدات مسجلة حالياً. اضغط "إضافة معدة جديدة" للبدء.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-[#161616]">
                      <td className="p-3.5">
                        {eq.imageUrl ? (
                          <img
                            src={eq.imageUrl}
                            alt={eq.name}
                            onClick={() => setPreviewImage(eq.imageUrl!)}
                            className="w-9 h-9 object-cover rounded border border-[#333333] cursor-pointer hover:opacity-80"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-[#1f1f1f] flex items-center justify-center text-[#555555]">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {eq.name}
                        {eq.notes && (
                          <span className="block text-[10px] text-[#888888] font-normal">
                            {eq.notes}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#007BFF] font-mono tabular-nums whitespace-nowrap">
                        {eq.code}
                      </td>
                      <td className="p-3.5 text-white tabular-nums whitespace-nowrap">
                        {eq.quantity}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                        {formatCurrency(eq.unitPrice, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 font-bold text-white tabular-nums whitespace-nowrap">
                        {formatCurrency(eq.totalValue, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">{eq.location}</td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(eq.purchaseDate)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEquipmentEdit(eq)}
                            className="p-1.5 text-[#007BFF] hover:bg-[#1a2536] rounded-md transition-colors"
                            title="تعديل المعدة"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmData({ id: eq.id, type: 'equipment' })}
                            className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                            title="حذف المعدة"
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

      {/* Section 3: Maintenance Log Table */}
      {activeTab === 'maintenance' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">الماكينة</th>
                  <th className="p-3.5">وصف الصيانة</th>
                  <th className="p-3.5">التكلفة</th>
                  <th className="p-3.5">الفني / الشركة المنفذة</th>
                  <th className="p-3.5">تاريخ الصيانة</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {maintenances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#666666]">
                      لا توجد عمليات صيانة مسجلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  maintenances.map((maint) => (
                    <tr key={maint.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {maint.machineName}
                      </td>
                      <td className="p-3.5 text-white">{maint.description}</td>
                      <td className="p-3.5 font-bold text-red-400 tabular-nums whitespace-nowrap">
                        {formatCurrency(maint.cost, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">
                        {maint.technician}
                      </td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(maint.date)}
                      </td>
                      <td className="p-3.5 text-[#888888]">{maint.notes || '-'}</td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmData({ id: maint.id, type: 'maintenance' })
                          }
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                          title="حذف سجل الصيانة"
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

      {/* Add / Edit Machine Modal */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white">
                {editingMachine ? 'تعديل بيانات الماكينة' : 'إضافة ماكينة جديدة للمصنع'}
              </h3>
              <button
                onClick={() => setIsMachineModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم الماكينة <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ماكينة حقن بلاستيك / مخرطة CNC"
                  value={machineForm.name}
                  onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    كود / رقم الماكينة
                  </label>
                  <input
                    type="text"
                    required
                    value={machineForm.code}
                    onChange={(e) => setMachineForm({ ...machineForm, code: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">العدد</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={machineForm.quantity}
                    onChange={(e) =>
                      setMachineForm({ ...machineForm, quantity: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    سعر الماكينة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={machineForm.purchasePrice}
                    onChange={(e) =>
                      setMachineForm({ ...machineForm, purchasePrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ الشراء
                  </label>
                  <input
                    type="date"
                    required
                    value={machineForm.purchaseDate}
                    onChange={(e) =>
                      setMachineForm({ ...machineForm, purchaseDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    الحالة التشغيلية
                  </label>
                  <select
                    value={machineForm.status}
                    onChange={(e) =>
                      setMachineForm({ ...machineForm, status: e.target.value as MachineStatus })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="working">تعمل</option>
                    <option value="maintenance">تحتاج إلى صيانة</option>
                    <option value="stopped">متوقفة</option>
                    <option value="out_of_service">خارج الخدمة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    القسم الموجود به المكن
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عنبر الإنتاج رقم 1"
                    value={machineForm.department}
                    onChange={(e) =>
                      setMachineForm({ ...machineForm, department: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  ملاحظات أو مواصفات فنية
                </label>
                <textarea
                  rows={2}
                  value={machineForm.notes}
                  onChange={(e) => setMachineForm({ ...machineForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsMachineModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  {editingMachine ? 'تحديث الماكينة' : 'حفظ الماكينة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Equipment Modal */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white">
                {editingEquipment ? 'تعديل بيانات المعدة' : 'إضافة معدة جديدة'}
              </h3>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم المعدة <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كمبروسر هواء / رافعة شوكية / ميزان إلكتروني"
                  value={equipmentForm.name}
                  onChange={(e) =>
                    setEquipmentForm({ ...equipmentForm, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    كود / رقم المعدة
                  </label>
                  <input
                    type="text"
                    required
                    value={equipmentForm.code}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, code: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">العدد</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={equipmentForm.quantity}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, quantity: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    سعر الوحدة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={equipmentForm.unitPrice}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, unitPrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    الموقع داخل المصنع
                  </label>
                  <input
                    type="text"
                    required
                    value={equipmentForm.location}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, location: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    حالة المعدة
                  </label>
                  <select
                    value={equipmentForm.status}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, status: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="excellent">ممتازة</option>
                    <option value="good">جيدة</option>
                    <option value="needs_maintenance">تحتاج لصيانة</option>
                    <option value="out_of_service">خارج الخدمة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ الشراء
                  </label>
                  <input
                    type="date"
                    required
                    value={equipmentForm.purchaseDate}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, purchaseDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  صورة المعدة (محفوظة محلياً على جهازك)
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
                  {equipmentForm.imageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={equipmentForm.imageUrl}
                        alt="معاينة"
                        className="w-8 h-8 object-cover rounded border border-[#333333]"
                      />
                      <button
                        type="button"
                        onClick={() => setEquipmentForm((prev) => ({ ...prev, imageUrl: '' }))}
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
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  {editingEquipment ? 'تحديث المعدة' : 'حفظ المعدة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                تسجيل عملية صيانة للماكينة
              </h3>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">الماكينة</label>
                <select
                  required
                  value={maintenanceForm.machineId}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, machineId: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="">اختر الماكينة...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#121212]">
                      {m.name} ({m.code}) - {m.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  وصف الصيانة المنجزة
                </label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.description}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تكلفة الصيانة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={maintenanceForm.cost}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ الصيانة
                  </label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.date}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, date: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  الفني أو جهة الصيانة
                </label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.technician}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222222] text-[11px] text-[#888888]">
                ملاحظة: سيتم تسجيل تكلفة الصيانة تلقائياً ضمن بند مصروفات المصنع لتحديث الحسابات.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  تسجيل الصيانة
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
        isOpen={!!deleteConfirmData}
        onClose={() => setDeleteConfirmData(null)}
        onConfirm={() => {
          if (!deleteConfirmData) return;
          if (deleteConfirmData.type === 'machine') {
            deleteMachine(deleteConfirmData.id);
          } else if (deleteConfirmData.type === 'equipment') {
            deleteEquipment(deleteConfirmData.id);
          } else {
            deleteMaintenance(deleteConfirmData.id);
          }
        }}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا السجل نهائياً؟"
      />
    </div>
  );
};
