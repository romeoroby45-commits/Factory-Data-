import React, { useState } from 'react';
import {
  PackageCheck,
  PlusCircle,
  Search,
  ShoppingCart,
  TrendingUp,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { FinishedProduct, ProductSale } from '../types';
import {
  generateId,
  formatCurrency,
  formatDate,
  getTodayDateString,
} from '../utils/helpers';
import { ConfirmModal } from '../components/ConfirmModal';

export const FinishedProductsView: React.FC = () => {
  const {
    finishedProducts,
    productSales,
    addFinishedProduct,
    updateFinishedProduct,
    deleteFinishedProduct,
    recordProductSale,
    settings,
  } = useFactory();

  const [activeTab, setActiveTab] = useState<'products' | 'sales'>('products');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FinishedProduct | null>(null);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState<FinishedProduct | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Product Form
  const [productForm, setProductForm] = useState<{
    name: string;
    code: string;
    availableQty: number;
    manufacturingCost: number;
    sellingPrice: number;
    productionDate: string;
    notes: string;
  }>({
    name: '',
    code: '',
    availableQty: 50,
    manufacturingCost: 60,
    sellingPrice: 95,
    productionDate: getTodayDateString(),
    notes: '',
  });

  // Sale Form
  const [saleForm, setSaleForm] = useState<{
    quantity: number;
    unitPrice: number;
    clientName: string;
    paymentMethod: string;
    date: string;
    notes: string;
  }>({
    quantity: 10,
    unitPrice: 95,
    clientName: '',
    paymentMethod: 'نقدي',
    date: getTodayDateString(),
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      code: `FP-${Math.floor(1000 + Math.random() * 9000)}`,
      availableQty: 50,
      manufacturingCost: 60,
      sellingPrice: 95,
      productionDate: getTodayDateString(),
      notes: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (prod: FinishedProduct) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      code: prod.code,
      availableQty: prod.availableQty,
      manufacturingCost: prod.manufacturingCost,
      sellingPrice: prod.sellingPrice,
      productionDate: prod.productionDate,
      notes: prod.notes || '',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const qty = Number(productForm.availableQty) || 0;
    const sellPrice = Number(productForm.sellingPrice) || 0;
    const cost = Number(productForm.manufacturingCost) || 0;
    const totalVal = qty * sellPrice;

    if (editingProduct) {
      await updateFinishedProduct({
        ...editingProduct,
        name: productForm.name.trim(),
        code: productForm.code.trim(),
        availableQty: qty,
        manufacturingCost: cost,
        sellingPrice: sellPrice,
        totalValue: totalVal,
        productionDate: productForm.productionDate,
        notes: productForm.notes.trim() || undefined,
        status: qty === 0 ? 'out_of_stock' : qty <= 5 ? 'low_stock' : 'available',
      });
    } else {
      const newProd: FinishedProduct = {
        id: generateId(),
        name: productForm.name.trim(),
        code: productForm.code.trim(),
        availableQty: qty,
        manufacturingCost: cost,
        sellingPrice: sellPrice,
        totalValue: totalVal,
        productionDate: productForm.productionDate,
        notes: productForm.notes.trim() || undefined,
        status: qty === 0 ? 'out_of_stock' : qty <= 5 ? 'low_stock' : 'available',
        createdAt: new Date().toISOString(),
      };
      await addFinishedProduct(newProd);
    }
    setIsProductModalOpen(false);
  };

  // Open Sale Modal
  const handleOpenSale = (prod: FinishedProduct) => {
    setSelectedProductForSale(prod);
    setSaleForm({
      quantity: Math.min(10, prod.availableQty || 1),
      unitPrice: prod.sellingPrice,
      clientName: '',
      paymentMethod: 'نقدي',
      date: getTodayDateString(),
      notes: '',
    });
    setIsSaleModalOpen(true);
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForSale) return;

    const qty = Number(saleForm.quantity) || 0;
    if (qty <= 0) {
      alert('يرجى تحديد كمية بيع صحيحة');
      return;
    }

    if (qty > selectedProductForSale.availableQty) {
      alert(
        `الكمية المتاحة في المستودع حالياً هي ${selectedProductForSale.availableQty} قطعة فقط!`
      );
      return;
    }

    const unitPrice = Number(saleForm.unitPrice) || selectedProductForSale.sellingPrice;
    const totalRevenue = qty * unitPrice;
    const totalCost = qty * selectedProductForSale.manufacturingCost;
    const profit = totalRevenue - totalCost;

    const newSale: ProductSale = {
      id: generateId(),
      productId: selectedProductForSale.id,
      productName: selectedProductForSale.name,
      quantity: qty,
      unitPrice,
      totalRevenue,
      totalCost,
      profit,
      clientName: saleForm.clientName.trim() || 'عميل نقدي',
      paymentMethod: saleForm.paymentMethod,
      date: saleForm.date,
      notes: saleForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await recordProductSale(newSale);
    setIsSaleModalOpen(false);
  };

  const filteredProducts = finishedProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFinishedValuation = finishedProducts.reduce(
    (acc, p) => acc + (p.totalValue || p.availableQty * p.sellingPrice || 0),
    0
  );
  const totalSalesRevenue = productSales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalSalesProfit = productSales.reduce((acc, s) => acc + s.profit, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#007BFF]" />
            إدارة المنتجات التامة والمبيعات
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            متابعة مخزون المنتجات الجاهزة للتسليم، تسجيل المبيعات وحساب الأرباح المحققة تلقائياً
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة منتج تام جديد
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي قيمة المنتجات التامة بالمصنع</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {formatCurrency(totalFinishedValuation, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            {finishedProducts.length} صنف جاهز بالمستودع
          </span>
        </div>

        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">إجمالي مبيعات المنتجات التامة</span>
          <span className="text-xl font-bold text-emerald-400 tabular-nums">
            {formatCurrency(totalSalesRevenue, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            {productSales.length} عملية بيع منجزة
          </span>
        </div>

        <div className="p-4 bg-[#121212] border border-[#222222] rounded-xl">
          <span className="text-xs text-[#B0B0B0] block mb-1">صافي أرباح مبيعات المنتجات</span>
          <span className="text-xl font-bold text-[#007BFF] tabular-nums">
            {formatCurrency(totalSalesProfit, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-[#888888] block mt-1">
            (إجمالي الإيراد - تكاليف التصنيع)
          </span>
        </div>
      </div>

      {/* Toolbar & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-[#222222] rounded-xl">
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[#0a0a0a] border border-[#222222] rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'products'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              المنتجات التامة بالمستودع ({finishedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'sales'
                  ? 'bg-[#007BFF] text-white shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              سجل فواتير المبيعات ({productSales.length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#666666]" />
          <input
            type="text"
            placeholder="بحث بالمنتج أو الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8 pl-3 py-1.5 bg-[#000000] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#007BFF] w-64"
          />
        </div>
      </div>

      {/* Tab 1: Finished Products Table */}
      {activeTab === 'products' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">اسم المنتج التام</th>
                  <th className="p-3.5">الكود</th>
                  <th className="p-3.5">الكمية المتاحة</th>
                  <th className="p-3.5">تكلفة التصنيع</th>
                  <th className="p-3.5">سعر البيع</th>
                  <th className="p-3.5">هامش الربح / وحدة</th>
                  <th className="p-3.5">إجمالي القيمة</th>
                  <th className="p-3.5">تاريخ الإنتاج</th>
                  <th className="p-3.5 text-center">بيع وخروج</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-[#666666]">
                      لا توجد منتجات تامة مسجلة بالمستودع حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const unitMargin = p.sellingPrice - p.manufacturingCost;
                    const isOutOfStock = p.availableQty <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#161616]">
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {p.name}
                          {p.notes && (
                            <span className="block text-[10px] text-[#888888] font-normal">
                              {p.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-[#007BFF] font-mono tabular-nums whitespace-nowrap">
                          {p.code}
                        </td>
                        <td className="p-3.5 font-bold whitespace-nowrap tabular-nums">
                          <span className={isOutOfStock ? 'text-red-400' : 'text-emerald-400'}>
                            {p.availableQty} قطعة
                          </span>
                        </td>
                        <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                          {formatCurrency(p.manufacturingCost, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 text-white font-semibold tabular-nums whitespace-nowrap">
                          {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 text-emerald-400 tabular-nums whitespace-nowrap font-bold">
                          +{formatCurrency(unitMargin, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 font-bold text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(
                            p.totalValue || p.availableQty * p.sellingPrice,
                            settings.currencySymbol
                          )}
                        </td>
                        <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                          {formatDate(p.productionDate)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleOpenSale(p)}
                            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 mx-auto transition-all ${
                              isOutOfStock
                                ? 'bg-[#1a1a1a] text-[#555555] cursor-not-allowed'
                                : 'bg-[#007BFF] hover:bg-[#0056B3] text-white shadow-sm'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            تسجيل بيع
                          </button>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-[#007BFF] hover:bg-[#1a2536] rounded-md transition-colors"
                              title="تعديل المنتج"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
                              title="حذف المنتج"
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

      {/* Tab 2: Sales Invoices Table */}
      {activeTab === 'sales' && (
        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs table-dark">
              <thead>
                <tr>
                  <th className="p-3.5">المنتج المباع</th>
                  <th className="p-3.5">الكمية المباعة</th>
                  <th className="p-3.5">سعر الوحدة</th>
                  <th className="p-3.5">إجمالي قيمة الفاتورة</th>
                  <th className="p-3.5">ربح العملية</th>
                  <th className="p-3.5">اسم العميل</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {productSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#666666]">
                      لم يتم تسجيل أي عمليات بيع حتى الآن.
                    </td>
                  </tr>
                ) : (
                  productSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-[#161616]">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {sale.productName}
                      </td>
                      <td className="p-3.5 font-bold text-white tabular-nums whitespace-nowrap">
                        {sale.quantity} قطعة
                      </td>
                      <td className="p-3.5 text-[#B0B0B0] tabular-nums whitespace-nowrap">
                        {formatCurrency(sale.unitPrice, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                        {formatCurrency(sale.totalRevenue, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 font-bold text-[#007BFF] tabular-nums whitespace-nowrap">
                        +{formatCurrency(sale.profit, settings.currencySymbol)}
                      </td>
                      <td className="p-3.5 text-white whitespace-nowrap">{sale.clientName}</td>
                      <td className="p-3.5 text-[#B0B0B0] whitespace-nowrap">
                        {sale.paymentMethod}
                      </td>
                      <td className="p-3.5 text-[#888888] tabular-nums whitespace-nowrap">
                        {formatDate(sale.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'تعديل بيانات المنتج التام' : 'إضافة منتج تام جديد'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#B0B0B0] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم المنتج التام <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: زجاجة بلاستيكية 1 لتر سداسية / مكتب خشب زان"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    كود المنتج
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    الكمية المتاحة (قطع)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.availableQty}
                    onChange={(e) =>
                      setProductForm({ ...productForm, availableQty: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تكلفة التصنيع للوحدة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={productForm.manufacturingCost}
                    onChange={(e) =>
                      setProductForm({ ...productForm, manufacturingCost: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    سعر البيع للوحدة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={productForm.sellingPrice}
                    onChange={(e) =>
                      setProductForm({ ...productForm, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  تاريخ الإنتاج
                </label>
                <input
                  type="date"
                  required
                  value={productForm.productionDate}
                  onChange={(e) =>
                    setProductForm({ ...productForm, productionDate: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={productForm.notes}
                  onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm"
                >
                  {editingProduct ? 'تحديث المنتج' : 'حفظ المنتج التام'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {isSaleModalOpen && selectedProductForSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-[#007BFF]" />
              تسجيل فاتورة بيع: {selectedProductForSale.name}
            </h3>

            <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222222] text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-[#888888]">الكمية المتاحة:</span>
                <span className="font-bold text-white tabular-nums">
                  {selectedProductForSale.availableQty} قطعة
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">تكلفة الوحدة:</span>
                <span className="text-[#B0B0B0] tabular-nums">
                  {formatCurrency(selectedProductForSale.manufacturingCost, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveSale} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    الكمية المباعة
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProductForSale.availableQty}
                    required
                    value={saleForm.quantity}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, quantity: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    سعر البيع للقطعة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={saleForm.unitPrice}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, unitPrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                  اسم العميل أو الجهة المشترية
                </label>
                <input
                  type="text"
                  placeholder="مثال: شركة النصر للتجارة / عميل نقدي"
                  value={saleForm.clientName}
                  onChange={(e) => setSaleForm({ ...saleForm, clientName: e.target.value })}
                  className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    طريقة الدفع
                  </label>
                  <select
                    value={saleForm.paymentMethod}
                    onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="نقدي">نقدي (كاش)</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك بنكي</option>
                    <option value="فودافون كاش">فودافون كاش</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B0B0B0] mb-1">
                    تاريخ العملية
                  </label>
                  <input
                    type="date"
                    required
                    value={saleForm.date}
                    onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                    className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0a160d] rounded-lg border border-emerald-900/60 text-xs">
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>إجمالي الإيراد المحصل:</span>
                  <span className="tabular-nums">
                    {formatCurrency(saleForm.quantity * saleForm.unitPrice, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#B0B0B0] mt-1">
                  <span>صافي الربح التقديري:</span>
                  <span className="text-white font-bold tabular-nums">
                    +
                    {formatCurrency(
                      saleForm.quantity *
                        (saleForm.unitPrice - selectedProductForSale.manufacturingCost),
                      settings.currencySymbol
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#B0B0B0] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] rounded-lg shadow-sm"
                >
                  تأكيد البيع وتحديث الخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteFinishedProduct(deleteConfirmId);
        }}
        title="تأكيد حذف المنتج التام"
        message="هل أنت متأكد من حذف هذا المنتج نهائياً من المستودع؟"
      />
    </div>
  );
};
