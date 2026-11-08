/**
 * Factory Data - Main Application Context
 * Centralizes all IndexedDB collections, reactive state, and calculated metrics.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  FactorySettings,
  Employee,
  Deduction,
  Bonus,
  PayrollRecord,
  Equipment,
  Machine,
  MachineMaintenance,
  InventoryItem,
  InventoryMovement,
  WorkInProgressItem,
  FinishedProduct,
  ProductSale,
  ToolItem,
  CapitalTransaction,
  Expense,
  Revenue,
  Withdrawal,
  UserRole,
} from '../types';
import * as db from '../services/db';

interface FinancialMetrics {
  baseCapital: number;
  capitalAdditions: number;
  capitalWithdrawals: number;
  netCapital: number;
  totalRevenue: number;
  totalExpenses: number;
  totalSalariesPaid: number;
  totalDeductions: number;
  totalBonuses: number;
  totalWithdrawals: number;
  totalInventoryValuation: number;
  totalEquipmentValuation: number;
  netProfit: number;
  currentCashBalance: number;
}

interface FactoryContextType {
  loading: boolean;
  settings: FactorySettings;
  updateSettings: (newSettings: Partial<FactorySettings>) => Promise<void>;
  
  // Collections
  employees: Employee[];
  deductions: Deduction[];
  bonuses: Bonus[];
  payrolls: PayrollRecord[];
  equipment: Equipment[];
  machines: Machine[];
  maintenances: MachineMaintenance[];
  inventory: InventoryItem[];
  movements: InventoryMovement[];
  workInProgress: WorkInProgressItem[];
  finishedProducts: FinishedProduct[];
  productSales: ProductSale[];
  tools: ToolItem[];
  capitalTransactions: CapitalTransaction[];
  expenses: Expense[];
  revenues: Revenue[];
  withdrawals: Withdrawal[];

  // Metrics
  metrics: FinancialMetrics;

  // CRUD Methods
  addEmployee: (item: Employee) => Promise<void>;
  updateEmployee: (item: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  addDeduction: (item: Deduction) => Promise<void>;
  deleteDeduction: (id: string) => Promise<void>;

  addBonus: (item: Bonus) => Promise<void>;
  deleteBonus: (id: string) => Promise<void>;

  addPayroll: (item: PayrollRecord) => Promise<void>;
  deletePayroll: (id: string) => Promise<void>;

  addEquipment: (item: Equipment) => Promise<void>;
  updateEquipment: (item: Equipment) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;

  addMachine: (item: Machine) => Promise<void>;
  updateMachine: (item: Machine) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;

  addMaintenance: (item: MachineMaintenance) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;

  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  recordInventoryMovement: (movement: InventoryMovement) => Promise<void>;

  addWorkInProgress: (item: WorkInProgressItem) => Promise<void>;
  updateWorkInProgress: (item: WorkInProgressItem) => Promise<void>;
  deleteWorkInProgress: (id: string) => Promise<void>;
  convertToFinishedProduct: (wipId: string, sellingPrice: number) => Promise<void>;

  addFinishedProduct: (item: FinishedProduct) => Promise<void>;
  updateFinishedProduct: (item: FinishedProduct) => Promise<void>;
  deleteFinishedProduct: (id: string) => Promise<void>;
  recordProductSale: (sale: ProductSale) => Promise<void>;

  addTool: (item: ToolItem) => Promise<void>;
  updateTool: (item: ToolItem) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;

  addCapitalTransaction: (item: CapitalTransaction) => Promise<void>;
  deleteCapitalTransaction: (id: string) => Promise<void>;

  addExpense: (item: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addRevenue: (item: Revenue) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;

  addWithdrawal: (item: Withdrawal) => Promise<void>;
  deleteWithdrawal: (id: string) => Promise<void>;

  // System
  refreshAllData: () => Promise<void>;
  exportBackup: () => Promise<db.CompleteBackupPayload>;
  importBackup: (payload: db.CompleteBackupPayload) => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export const FactoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FactorySettings>(db.INITIAL_FACTORY_SETTINGS);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [maintenances, setMaintenances] = useState<MachineMaintenance[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [workInProgress, setWorkInProgress] = useState<WorkInProgressItem[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [capitalTransactions, setCapitalTransactions] = useState<CapitalTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        sSettings,
        sEmployees,
        sDeductions,
        sBonuses,
        sPayrolls,
        sEquipment,
        sMachines,
        sMaintenances,
        sInventory,
        sMovements,
        sWIP,
        sFinished,
        sSales,
        sTools,
        sCapital,
        sExpenses,
        sRevenues,
        sWithdrawals,
      ] = await Promise.all([
        db.getSettings(),
        db.getAllFromStore<Employee>('employees'),
        db.getAllFromStore<Deduction>('deductions'),
        db.getAllFromStore<Bonus>('bonuses'),
        db.getAllFromStore<PayrollRecord>('payrolls'),
        db.getAllFromStore<Equipment>('equipment'),
        db.getAllFromStore<Machine>('machines'),
        db.getAllFromStore<MachineMaintenance>('maintenances'),
        db.getAllFromStore<InventoryItem>('inventory'),
        db.getAllFromStore<InventoryMovement>('inventoryMovements'),
        db.getAllFromStore<WorkInProgressItem>('workInProgress'),
        db.getAllFromStore<FinishedProduct>('finishedProducts'),
        db.getAllFromStore<ProductSale>('productSales'),
        db.getAllFromStore<ToolItem>('tools'),
        db.getAllFromStore<CapitalTransaction>('capitalTransactions'),
        db.getAllFromStore<Expense>('expenses'),
        db.getAllFromStore<Revenue>('revenues'),
        db.getAllFromStore<Withdrawal>('withdrawals'),
      ]);

      setSettings(sSettings);
      setEmployees(sEmployees);
      setDeductions(sDeductions);
      setBonuses(sBonuses);
      setPayrolls(sPayrolls);
      setEquipment(sEquipment);
      setMachines(sMachines);
      setMaintenances(sMaintenances);
      setInventory(sInventory);
      setMovements(sMovements);
      setWorkInProgress(sWIP);
      setFinishedProducts(sFinished);
      setProductSales(sSales);
      setTools(sTools);
      setCapitalTransactions(sCapital);
      setExpenses(sExpenses);
      setRevenues(sRevenues);
      setWithdrawals(sWithdrawals);
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Financial calculations
  const metrics = useMemo<FinancialMetrics>(() => {
    let baseCapital = 0;
    let capitalAdditions = 0;
    let capitalWithdrawals = 0;

    capitalTransactions.forEach((tx) => {
      if (tx.type === 'INITIAL') baseCapital += tx.amount || 0;
      else if (tx.type === 'ADDITION') capitalAdditions += tx.amount || 0;
      else if (tx.type === 'WITHDRAWAL') capitalWithdrawals += tx.amount || 0;
    });

    const netCapital = baseCapital + capitalAdditions - capitalWithdrawals;

    const totalRevenue = revenues.reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalSalariesPaid = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);
    const totalDeductions = deductions.reduce((acc, d) => acc + (d.amount || 0), 0);
    const totalBonuses = bonuses.reduce((acc, b) => acc + (b.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);

    const totalInventoryValuation = inventory.reduce((acc, i) => acc + (i.totalValue || i.quantity * i.unitPrice || 0), 0);
    const totalEquipmentValuation =
      equipment.reduce((acc, eq) => acc + (eq.totalValue || eq.quantity * eq.unitPrice || 0), 0) +
      machines.reduce((acc, m) => acc + (m.purchasePrice * (m.quantity || 1) || 0), 0) +
      tools.reduce((acc, t) => acc + (t.totalValue || t.quantity * t.unitPrice || 0), 0);

    // Net Profit: Revenues minus Expenses
    const netProfit = totalRevenue - totalExpenses;

    // Current Cash Balance:
    // Net Capital + Revenues - Expenses - Direct Partner Withdrawals
    const currentCashBalance = netCapital + totalRevenue - totalExpenses - totalWithdrawals;

    return {
      baseCapital,
      capitalAdditions,
      capitalWithdrawals,
      netCapital,
      totalRevenue,
      totalExpenses,
      totalSalariesPaid,
      totalDeductions,
      totalBonuses,
      totalWithdrawals,
      totalInventoryValuation,
      totalEquipmentValuation,
      netProfit,
      currentCashBalance,
    };
  }, [
    capitalTransactions,
    revenues,
    expenses,
    payrolls,
    deductions,
    bonuses,
    withdrawals,
    inventory,
    equipment,
    machines,
    tools,
  ]);

  const updateSettings = async (newSettings: Partial<FactorySettings>) => {
    const updated = await db.saveSettings(newSettings);
    setSettings(updated);
  };

  const switchUserRole = async (role: UserRole) => {
    await updateSettings({ currentUserRole: role });
  };

  // Employees CRUD
  const addEmployee = async (item: Employee) => {
    await db.putInStore('employees', item);
    setEmployees((prev) => [item, ...prev]);
  };
  const updateEmployee = async (item: Employee) => {
    await db.putInStore('employees', item);
    setEmployees((prev) => prev.map((e) => (e.id === item.id ? item : e)));
  };
  const deleteEmployee = async (id: string) => {
    await db.deleteFromStore('employees', id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // Deductions CRUD
  const addDeduction = async (item: Deduction) => {
    await db.putInStore('deductions', item);
    setDeductions((prev) => [item, ...prev]);
  };
  const deleteDeduction = async (id: string) => {
    await db.deleteFromStore('deductions', id);
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  };

  // Bonuses CRUD
  const addBonus = async (item: Bonus) => {
    await db.putInStore('bonuses', item);
    setBonuses((prev) => [item, ...prev]);
  };
  const deleteBonus = async (id: string) => {
    await db.deleteFromStore('bonuses', id);
    setBonuses((prev) => prev.filter((b) => b.id !== id));
  };

  // Payroll CRUD
  const addPayroll = async (item: PayrollRecord) => {
    await db.putInStore('payrolls', item);
    setPayrolls((prev) => [item, ...prev]);

    // Automatically record an expense for the paid salary
    const salaryExpense: Expense = {
      id: `exp_${item.id}`,
      title: `راتب شهر ${item.month}/${item.year} - ${item.employeeName}`,
      amount: item.netSalary,
      date: item.paymentDate,
      category: 'الرواتب',
      reason: `صرف الراتب الأساسي مع المكافآت والخصومات`,
      responsible: 'قسم الحسابات',
      notes: `الراتب الأساسي: ${item.basicSalary} | مكافآت: ${item.bonuses} | خصومات: ${item.deductions}`,
      createdAt: new Date().toISOString(),
    };
    await db.putInStore('expenses', salaryExpense);
    setExpenses((prev) => [salaryExpense, ...prev]);
  };
  const deletePayroll = async (id: string) => {
    await db.deleteFromStore('payrolls', id);
    setPayrolls((prev) => prev.filter((p) => p.id !== id));
    // Also remove associated automatic expense if exists
    await db.deleteFromStore('expenses', `exp_${id}`);
    setExpenses((prev) => prev.filter((e) => e.id !== `exp_${id}`));
  };

  // Equipment CRUD
  const addEquipment = async (item: Equipment) => {
    await db.putInStore('equipment', item);
    setEquipment((prev) => [item, ...prev]);
  };
  const updateEquipment = async (item: Equipment) => {
    await db.putInStore('equipment', item);
    setEquipment((prev) => prev.map((e) => (e.id === item.id ? item : e)));
  };
  const deleteEquipment = async (id: string) => {
    await db.deleteFromStore('equipment', id);
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  };

  // Machines CRUD
  const addMachine = async (item: Machine) => {
    await db.putInStore('machines', item);
    setMachines((prev) => [item, ...prev]);
  };
  const updateMachine = async (item: Machine) => {
    await db.putInStore('machines', item);
    setMachines((prev) => prev.map((m) => (m.id === item.id ? item : m)));
  };
  const deleteMachine = async (id: string) => {
    await db.deleteFromStore('machines', id);
    setMachines((prev) => prev.filter((m) => m.id !== id));
  };

  // Maintenances CRUD
  const addMaintenance = async (item: MachineMaintenance) => {
    await db.putInStore('maintenances', item);
    setMaintenances((prev) => [item, ...prev]);

    // Automatically record maintenance expense if cost > 0
    if (item.cost > 0) {
      const maintExpense: Expense = {
        id: `maint_exp_${item.id}`,
        title: `صيانة ماكينة: ${item.machineName}`,
        amount: item.cost,
        date: item.date,
        category: 'الصيانة',
        reason: item.description,
        responsible: item.technician,
        notes: item.notes,
        createdAt: new Date().toISOString(),
      };
      await db.putInStore('expenses', maintExpense);
      setExpenses((prev) => [maintExpense, ...prev]);
    }
  };
  const deleteMaintenance = async (id: string) => {
    await db.deleteFromStore('maintenances', id);
    setMaintenances((prev) => prev.filter((m) => m.id !== id));
    await db.deleteFromStore('expenses', `maint_exp_${id}`);
    setExpenses((prev) => prev.filter((e) => e.id !== `maint_exp_${id}`));
  };

  // Inventory CRUD
  const addInventoryItem = async (item: InventoryItem) => {
    await db.putInStore('inventory', item);
    setInventory((prev) => [item, ...prev]);
  };
  const updateInventoryItem = async (item: InventoryItem) => {
    await db.putInStore('inventory', item);
    setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  };
  const deleteInventoryItem = async (id: string) => {
    await db.deleteFromStore('inventory', id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const recordInventoryMovement = async (movement: InventoryMovement) => {
    const item = inventory.find((i) => i.id === movement.itemId);
    if (!item) return;

    let newQty = item.quantity;
    if (movement.type === 'IN') {
      newQty += movement.quantity;
    } else {
      // OUT or WASTE
      newQty = Math.max(0, newQty - movement.quantity);
    }

    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQty,
      totalValue: newQty * item.unitPrice,
    };

    const updatedMovement = {
      ...movement,
      remainingQty: newQty,
    };

    await db.putInStore('inventory', updatedItem);
    await db.putInStore('inventoryMovements', updatedMovement);

    setInventory((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    setMovements((prev) => [updatedMovement, ...prev]);
  };

  // Work In Progress CRUD
  const addWorkInProgress = async (item: WorkInProgressItem) => {
    await db.putInStore('workInProgress', item);
    setWorkInProgress((prev) => [item, ...prev]);
  };
  const updateWorkInProgress = async (item: WorkInProgressItem) => {
    await db.putInStore('workInProgress', item);
    setWorkInProgress((prev) => prev.map((w) => (w.id === item.id ? item : w)));
  };
  const deleteWorkInProgress = async (id: string) => {
    await db.deleteFromStore('workInProgress', id);
    setWorkInProgress((prev) => prev.filter((w) => w.id !== id));
  };

  const convertToFinishedProduct = async (wipId: string, sellingPrice: number) => {
    const wip = workInProgress.find((w) => w.id === wipId);
    if (!wip) return;

    const finishedItem: FinishedProduct = {
      id: `fp_${wip.id}`,
      name: wip.name,
      code: wip.code || `FP-${Date.now().toString().slice(-4)}`,
      availableQty: wip.completedQty > 0 ? wip.completedQty : wip.requiredQty,
      manufacturingCost: wip.productionCost,
      sellingPrice: sellingPrice,
      totalValue: (wip.completedQty > 0 ? wip.completedQty : wip.requiredQty) * sellingPrice,
      productionDate: new Date().toISOString().split('T')[0],
      status: 'available',
      notes: `تم تحويله تلقائيًا من المنتجات تحت التشغيل. خامات: ${wip.rawMaterialsUsed || 'لا يوجد'}`,
      createdAt: new Date().toISOString(),
    };

    const updatedWip: WorkInProgressItem = {
      ...wip,
      status: 'completed',
    };

    await db.putInStore('finishedProducts', finishedItem);
    await db.putInStore('workInProgress', updatedWip);

    setFinishedProducts((prev) => [finishedItem, ...prev]);
    setWorkInProgress((prev) => prev.map((w) => (w.id === wipId ? updatedWip : w)));
  };

  // Finished Products CRUD
  const addFinishedProduct = async (item: FinishedProduct) => {
    await db.putInStore('finishedProducts', item);
    setFinishedProducts((prev) => [item, ...prev]);
  };
  const updateFinishedProduct = async (item: FinishedProduct) => {
    await db.putInStore('finishedProducts', item);
    setFinishedProducts((prev) => prev.map((f) => (f.id === item.id ? item : f)));
  };
  const deleteFinishedProduct = async (id: string) => {
    await db.deleteFromStore('finishedProducts', id);
    setFinishedProducts((prev) => prev.filter((f) => f.id !== id));
  };

  const recordProductSale = async (sale: ProductSale) => {
    const product = finishedProducts.find((p) => p.id === sale.productId);
    if (!product) return;

    const remainingQty = Math.max(0, product.availableQty - sale.quantity);
    const updatedProduct: FinishedProduct = {
      ...product,
      availableQty: remainingQty,
      totalValue: remainingQty * product.sellingPrice,
      status: remainingQty === 0 ? 'out_of_stock' : remainingQty <= 5 ? 'low_stock' : 'available',
    };

    // Record sale
    await db.putInStore('productSales', sale);
    await db.putInStore('finishedProducts', updatedProduct);

    // Automatically record revenue
    const saleRevenue: Revenue = {
      id: `rev_sale_${sale.id}`,
      source: `بيع منتج تام: ${sale.productName} (كمية: ${sale.quantity})`,
      amount: sale.totalRevenue,
      date: sale.date,
      type: 'مبيعات منتجات',
      clientName: sale.clientName,
      paymentMethod: sale.paymentMethod as any,
      notes: `ربح العملية: ${sale.profit} ${settings.currencySymbol} | ملاحظات: ${sale.notes || 'لا يوجد'}`,
      createdAt: new Date().toISOString(),
    };
    await db.putInStore('revenues', saleRevenue);

    setProductSales((prev) => [sale, ...prev]);
    setFinishedProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setRevenues((prev) => [saleRevenue, ...prev]);
  };

  // Tools CRUD
  const addTool = async (item: ToolItem) => {
    await db.putInStore('tools', item);
    setTools((prev) => [item, ...prev]);
  };
  const updateTool = async (item: ToolItem) => {
    await db.putInStore('tools', item);
    setTools((prev) => prev.map((t) => (t.id === item.id ? item : t)));
  };
  const deleteTool = async (id: string) => {
    await db.deleteFromStore('tools', id);
    setTools((prev) => prev.filter((t) => t.id !== id));
  };

  // Capital Transactions CRUD
  const addCapitalTransaction = async (item: CapitalTransaction) => {
    await db.putInStore('capitalTransactions', item);
    setCapitalTransactions((prev) => [item, ...prev]);
  };
  const deleteCapitalTransaction = async (id: string) => {
    await db.deleteFromStore('capitalTransactions', id);
    setCapitalTransactions((prev) => prev.filter((c) => c.id !== id));
  };

  // Expenses CRUD
  const addExpense = async (item: Expense) => {
    await db.putInStore('expenses', item);
    setExpenses((prev) => [item, ...prev]);
  };
  const deleteExpense = async (id: string) => {
    await db.deleteFromStore('expenses', id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Revenues CRUD
  const addRevenue = async (item: Revenue) => {
    await db.putInStore('revenues', item);
    setRevenues((prev) => [item, ...prev]);
  };
  const deleteRevenue = async (id: string) => {
    await db.deleteFromStore('revenues', id);
    setRevenues((prev) => prev.filter((r) => r.id !== id));
  };

  // Withdrawals CRUD
  const addWithdrawal = async (item: Withdrawal) => {
    await db.putInStore('withdrawals', item);
    setWithdrawals((prev) => [item, ...prev]);
  };
  const deleteWithdrawal = async (id: string) => {
    await db.deleteFromStore('withdrawals', id);
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
  };

  // System methods
  const refreshAllData = async () => {
    await loadData();
  };

  const exportBackup = async () => {
    return await db.exportFullDatabase();
  };

  const importBackup = async (payload: db.CompleteBackupPayload) => {
    await db.importFullDatabase(payload);
    await loadData();
  };

  return (
    <FactoryContext.Provider
      value={{
        loading,
        settings,
        updateSettings,
        employees,
        deductions,
        bonuses,
        payrolls,
        equipment,
        machines,
        maintenances,
        inventory,
        movements,
        workInProgress,
        finishedProducts,
        productSales,
        tools,
        capitalTransactions,
        expenses,
        revenues,
        withdrawals,
        metrics,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addDeduction,
        deleteDeduction,
        addBonus,
        deleteBonus,
        addPayroll,
        deletePayroll,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addMachine,
        updateMachine,
        deleteMachine,
        addMaintenance,
        deleteMaintenance,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        recordInventoryMovement,
        addWorkInProgress,
        updateWorkInProgress,
        deleteWorkInProgress,
        convertToFinishedProduct,
        addFinishedProduct,
        updateFinishedProduct,
        deleteFinishedProduct,
        recordProductSale,
        addTool,
        updateTool,
        deleteTool,
        addCapitalTransaction,
        deleteCapitalTransaction,
        addExpense,
        deleteExpense,
        addRevenue,
        deleteRevenue,
        addWithdrawal,
        deleteWithdrawal,
        refreshAllData,
        exportBackup,
        importBackup,
        switchUserRole,
      }}
    >
      {children}
    </FactoryContext.Provider>
  );
};

export const useFactory = () => {
  const context = useContext(FactoryContext);
  if (!context) {
    throw new Error('useFactory must be used within a FactoryProvider');
  }
  return context;
};
