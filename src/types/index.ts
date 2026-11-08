/**
 * Factory Data - Core Type Definitions
 * Complete offline-first management system types
 */

export type UserRole = 'admin' | 'accountant' | 'inventory_manager' | 'hr_manager';

export interface FactorySettings {
  factoryName: string;
  factoryLogo?: string;
  address: string;
  phone: string;
  taxNumber?: string;
  commercialRegistration?: string;
  currency: string;
  currencySymbol: string;
  customCategories: string[];
  currentUserRole: UserRole;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  countryCode: string; // e.g. "+20"
  countryFlag: string; // e.g. "🇪🇬"
  nationalId?: string;
  role: string; // مهندس، عامل، فني، محاسب، مدير، etc.
  basicSalary: number;
  hireDate: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export interface Deduction {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  date: string;
  responsible: string;
  notes?: string;
  month: number;
  year: number;
  createdAt: string;
}

export interface Bonus {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  date: string;
  responsible: string;
  notes?: string;
  month: number;
  year: number;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  month: number;
  year: number;
  paymentDate: string;
  status: 'paid' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  purchaseDate: string;
  status: 'excellent' | 'good' | 'needs_maintenance' | 'out_of_service';
  location: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

export type MachineStatus = 'working' | 'maintenance' | 'stopped' | 'out_of_service';

export interface Machine {
  id: string;
  name: string;
  code: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  status: MachineStatus;
  department: string;
  notes?: string;
  createdAt: string;
}

export interface MachineMaintenance {
  id: string;
  machineId: string;
  machineName: string;
  date: string;
  description: string;
  cost: number;
  technician: string;
  notes?: string;
  createdAt: string;
}

export type InventoryStandardCategory = 
  | 'الخامات'
  | 'المستلزمات'
  | 'الإكسسوارات'
  | 'الدهانات'
  | 'التشطيبات'
  | 'المنتجات تحت التشغيل'
  | 'المنتجات التامة'
  | 'الأدوات';

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string; // كجم، متر، حبة، لتر، طن، دستة، علبة
  unitPrice: number;
  totalValue: number;
  supplier?: string;
  minAlertQty: number;
  location: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'WASTE'; // وارد، منصرف، هالك
  quantity: number;
  reason: string;
  date: string;
  responsible: string;
  remainingQty: number;
  notes?: string;
  createdAt: string;
}

export type WIPStatus = 'in_progress' | 'under_manufacturing' | 'completed' | 'paused';

export interface WorkInProgressItem {
  id: string;
  name: string;
  code: string;
  requiredQty: number;
  completedQty: number;
  rawMaterialsUsed: string;
  suppliesUsed: string;
  productionCost: number;
  startDate: string;
  expectedEndDate: string;
  status: WIPStatus;
  notes?: string;
  createdAt: string;
}

export interface FinishedProduct {
  id: string;
  name: string;
  code: string;
  availableQty: number;
  manufacturingCost: number;
  sellingPrice: number;
  totalValue: number;
  productionDate: string;
  status: 'available' | 'low_stock' | 'out_of_stock';
  notes?: string;
  createdAt: string;
}

export interface ProductSale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  clientName: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ToolItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  purchaseDate: string;
  condition: 'good' | 'fair' | 'needs_repair' | 'damaged';
  location: string;
  notes?: string;
  createdAt: string;
}

export interface CapitalTransaction {
  id: string;
  type: 'INITIAL' | 'ADDITION' | 'WITHDRAWAL';
  amount: number;
  date: string;
  responsible: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: 
    | 'الرواتب'
    | 'شراء الخامات'
    | 'شراء المعدات'
    | 'الصيانة'
    | 'الكهرباء'
    | 'المياه'
    | 'الإيجار'
    | 'الدهانات'
    | 'التشطيبات'
    | 'النقل'
    | 'مصروفات أخرى';
  reason: string;
  responsible: string;
  invoiceUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Revenue {
  id: string;
  source: string;
  amount: number;
  date: string;
  type: 'مبيعات منتجات' | 'خدمات تشغيل' | 'خردة وهالك' | 'أخرى';
  clientName: string;
  paymentMethod: 'نقدي' | 'تحويل بنكي' | 'شيك' | 'فودافون كاش' | 'أخرى';
  notes?: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  date: string;
  responsible: string;
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface CountryPhone {
  code: string;
  flag: string;
  name: string;
}

export interface StorageStats {
  recordCounts: Record<string, number>;
  totalRecords: number;
  estimatedSizeKb: number;
}
