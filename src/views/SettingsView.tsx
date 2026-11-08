import React, { useState, useEffect } from 'react';
import {
  Settings,
  HardDrive,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Building,
  DollarSign,
  UserCheck,
  RefreshCw,
  FileJson,
  Database,
  Trash2,
  Lock,
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { getStorageStats, CompleteBackupPayload } from '../services/db';
import { fileToBase64, getTodayDateString, formatDate } from '../utils/helpers';
import { ConfirmModal } from '../components/ConfirmModal';
import { UserRole } from '../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, exportBackup, importBackup, refreshAllData } = useFactory();

  // Factory Profile Form
  const [profileForm, setProfileForm] = useState({
    factoryName: settings.factoryName,
    address: settings.address,
    phone: settings.phone,
    taxNumber: settings.taxNumber || '',
    commercialRegistration: settings.commercialRegistration || '',
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [stats, setStats] = useState<{
    recordCounts: Record<string, number>;
    totalRecords: number;
    estimatedSizeKb: number;
  }>({
    recordCounts: {},
    totalRecords: 0,
    estimatedSizeKb: 0,
  });

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [pendingBackupPayload, setPendingBackupPayload] = useState<CompleteBackupPayload | null>(
    null
  );
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [settings]);

  const loadStats = async () => {
    try {
      const s = await getStorageStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(profileForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export full JSON Backup to user device
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const backupData = await exportBackup();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FactoryData_Backup_${settings.factoryName.replace(/\s+/g, '_')}_${getTodayDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle upload of JSON Backup file
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as CompleteBackupPayload;

        if (!parsed || !parsed.data || !parsed.appName) {
          throw new Error('الملف ليس ملف نسخة احتياطية صالح لنظام Factory Data');
        }

        setPendingBackupPayload(parsed);
        setIsRestoreConfirmOpen(true);
      } catch (err: any) {
        setRestoreError(err.message || 'الملف المرفوع غير صالح أو تالف');
      }
    };

    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Execute restore after confirmation
  const handleConfirmRestore = async () => {
    if (!pendingBackupPayload) return;
    try {
      await importBackup(pendingBackupPayload);
      setPendingBackupPayload(null);
      setRestoreSuccess(true);
      await loadStats();
      setTimeout(() => setRestoreSuccess(false), 4000);
    } catch (err: any) {
      setRestoreError(err.message || 'فشلت عملية الاستعادة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121212] border border-[#222222] rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#007BFF]" />
            إعدادات النظام والنسخ الاحتياطي والصلاحيات
          </h1>
          <p className="text-xs text-[#B0B0B0]">
            تخصيص هوية المصنع، إدارة التخزين المحلي الآمن، وتصدير واسترجاع قواعد البيانات
          </p>
        </div>
      </div>

      {/* Critical Local Storage Notice */}
      <div className="p-5 bg-[#0d141f] border border-[#007BFF]/40 rounded-xl space-y-3">
        <div className="flex items-center gap-3 text-white">
          <Database className="w-6 h-6 text-[#007BFF] shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-white">
              قاعدة بيانات خاصة وآمنة 100% – حفظ محلي على جهازك فقط
            </h3>
            <p className="text-xs text-[#B0B0B0] mt-0.5">
              جميع بيانات المصنع (الموظفين، الرواتب، الخامات، الماكينات، الحسابات) تُخزن داخل متصفح هذا
              الجهاز عبر تقنية IndexedDB المشفرة بدون أي قاعدة بيانات سحابية أو طرف ثالث.
            </p>
          </div>
        </div>

        <div className="p-3 bg-black/60 rounded-lg border border-[#222222] text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>تنبيه هام جداً للأمان:</strong> نظراً لأن البيانات محفوظة محلياً على هذا الجهاز
            فقط، فإن مسح بيانات التصفح (Clear Cache/Storage) أو فتح الموقع من جهاز/متصفح آخر لن يظهر
            بياناتك. <u>يُرجى تحميل نسخة احتياطية دورياً وحفظها على فلاشة أو قرص جهازك</u> لضمان حماية
            بيانات المصنع واسترجاعها في أي لحظة.
          </div>
        </div>
      </div>

      {/* Backup & Restore Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="p-5 bg-[#121212] border border-[#222222] rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">تصدير نسخة احتياطية كاملة</h3>
            </div>
            <p className="text-xs text-[#B0B0B0] leading-relaxed">
              تحميل ملف موحد بصيغة <code>.json</code> يشمل كافة أقسام المصنع (الموظفين، الرواتب،
              الخصومات، المعدات، الماكينات، المخزون، أوامر التشغيل، الحسابات المالية).
            </p>
          </div>

          <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222222] text-xs space-y-1">
            <div className="flex justify-between text-[#888888]">
              <span>إجمالي السجلات المسجلة:</span>
              <span className="font-bold text-white tabular-nums">{stats.totalRecords} سجل</span>
            </div>
            <div className="flex justify-between text-[#888888]">
              <span>الحجم التقريبي للبيانات:</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                {stats.estimatedSizeKb} كيلوبايت
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportBackup}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'جارٍ إنشاء النسخة...' : 'تحميل النسخة الاحتياطية على جهازي الآن'}
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="p-5 bg-[#121212] border border-[#222222] rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-[#007BFF]" />
              <h3 className="text-sm font-bold text-white">استعادة البيانات من نسخة احتياطية</h3>
            </div>
            <p className="text-xs text-[#B0B0B0] leading-relaxed">
              رفع ملف النسخة الاحتياطية واسترجاع جميع بيانات المصنع والحسابات على هذا الجهاز. سيتم
              طلب تأكيدك قبل استبدال أي بيانات حالية.
            </p>
          </div>

          {restoreSuccess && (
            <div className="p-3 bg-[#0a160d] border border-emerald-900/60 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>تمت استعادة كافة بيانات المصنع بنجاح تام!</span>
            </div>
          )}

          {restoreError && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{restoreError}</span>
            </div>
          )}

          <label className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>اختيار ملف النسخة الاحتياطية (.json)</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Factory Profile & Financial Settings Form */}
      <div className="p-6 bg-[#121212] border border-[#222222] rounded-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#007BFF]" />
            <h3 className="text-base font-bold text-white">بيانات المصنع والعملة الرسمية</h3>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> تم حفظ الإعدادات
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                اسم المصنع أو المنشأة الصناعية
              </label>
              <input
                type="text"
                required
                value={profileForm.factoryName}
                onChange={(e) => setProfileForm({ ...profileForm, factoryName: e.target.value })}
                className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                هاتف المصنع الرئيسي
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
              عنوان المصنع / المنطقة الصناعية
            </label>
            <input
              type="text"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                رقم السجل التجاري
              </label>
              <input
                type="text"
                value={profileForm.commercialRegistration}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, commercialRegistration: e.target.value })
                }
                className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                رقم البطاقة الضريبية
              </label>
              <input
                type="text"
                value={profileForm.taxNumber}
                onChange={(e) => setProfileForm({ ...profileForm, taxNumber: e.target.value })}
                className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                العملة الرسمية للنظام
              </label>
              <input
                type="text"
                value={profileForm.currency}
                onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0B0B0] mb-1.5">
                رمز العملة المختصر (مثل ج.م أو EGP)
              </label>
              <input
                type="text"
                value={profileForm.currencySymbol}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, currencySymbol: e.target.value })
                }
                className="w-full p-2.5 bg-[#000000] border border-[#27272a] rounded-lg text-white text-xs focus:outline-none focus:border-[#007BFF]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-sm transition-all"
            >
              حفظ بيانات المصنع
            </button>
          </div>
        </form>
      </div>

      {/* User Roles & Permissions Overview */}
      <div className="p-6 bg-[#121212] border border-[#222222] rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#222222]">
          <Shield className="w-5 h-5 text-[#007BFF]" />
          <h3 className="text-base font-bold text-white">أدوار المستخدمين والصلاحيات المتاحة</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-lg space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>المدير العام</span>
              <span className="text-[10px] text-[#007BFF] bg-blue-950/60 px-2 py-0.5 rounded">
                كامل الصلاحيات
              </span>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              الوصول لكافة أقسام المصنع، رأس المال، الرواتب، التقارير الشاملة، والإعدادات والنسخ
              الاحتياطي.
            </p>
          </div>

          <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-lg space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>المحاسب المالي</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                مالية ورواتب
              </span>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              إدارة الرواتب، تسجيل المصروفات والإيرادات، كشوف الحسابات والتقارير المالية والمبيعات.
            </p>
          </div>

          <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-lg space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>مسؤول المخزون</span>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded">
                مخازن وإنتاج
              </span>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              إدارة الخامات، المنتجات تحت التشغيل، المنتجات التامة، المعدات والماكينات وحركات الصرف
              والوارد.
            </p>
          </div>

          <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-lg space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>مسؤول الموظفين HR</span>
              <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded">
                شؤون العاملين
              </span>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              إضافة وتعديل بيانات الموظفين، تسجيل الخصومات والجزاءات، وإرسال إشعارات واتساب.
            </p>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={isRestoreConfirmOpen}
        onClose={() => {
          setIsRestoreConfirmOpen(false);
          setPendingBackupPayload(null);
        }}
        onConfirm={handleConfirmRestore}
        title="تأكيد استبدال البيانات واستعادة النسخة الاحتياطية"
        message={`هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟
تم تصديرها بتاريخ: ${
          pendingBackupPayload ? formatDate(pendingBackupPayload.exportedAt) : ''
        }

تحذير: سيتم استبدال البيانات الحالية على هذا الجهاز ببيانات النسخة المرفوعة بالكامل.`}
        confirmText="نعم، استبدل واسترجع البيانات"
        isDanger={true}
      />
    </div>
  );
};
