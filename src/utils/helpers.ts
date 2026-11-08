/**
 * Factory Data - Utility and Helper Functions
 */

import { CountryPhone } from '../types';

export const COUNTRY_CODES: CountryPhone[] = [
  { code: '+20', flag: '🇪🇬', name: 'مصر (Egypt)' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية (KSA)' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات (UAE)' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت (Kuwait)' },
  { code: '+974', flag: '🇶🇦', name: 'قطر (Qatar)' },
  { code: '+968', flag: '🇴🇲', name: 'عمان (Oman)' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين (Bahrain)' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن (Jordan)' },
  { code: '+964', flag: '🇮🇶', name: 'العراق (Iraq)' },
  { code: '+218', flag: '🇱🇾', name: 'ليبيا (Libya)' },
  { code: '+249', flag: '🇸🇩', name: 'السودان (Sudan)' },
  { code: '+216', flag: '🇹🇳', name: 'تونس (Tunisia)' },
  { code: '+213', flag: '🇩🇿', name: 'الجزائر (Algeria)' },
  { code: '+212', flag: '🇲🇦', name: 'المغرب (Morocco)' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان (Lebanon)' },
  { code: '+963', flag: '🇸🇾', name: 'سوريا (Syria)' },
  { code: '+967', flag: '🇾🇪', name: 'اليمن (Yemen)' },
  { code: '+970', flag: '🇵🇸', name: 'فلسطين (Palestine)' },
  { code: '+90', flag: '🇹🇷', name: 'تركيا (Turkey)' },
  { code: '+1', flag: '🇺🇸', name: 'الولايات المتحدة (USA)' },
  { code: '+44', flag: '🇬🇧', name: 'المملكة المتحدة (UK)' },
  { code: '+49', flag: '🇩🇪', name: 'ألمانيا (Germany)' },
  { code: '+86', flag: '🇨🇳', name: 'الصين (China)' },
];

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function formatCurrency(amount: number, symbol: string = 'ج.م'): string {
  const formatted = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  return `${formatted} ${symbol}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num || 0);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format phone number for WhatsApp link
 */
export function cleanPhoneNumber(countryCode: string, phone: string): string {
  const cleanCode = countryCode.replace(/[^0-9]/g, '');
  let cleanLocal = phone.replace(/[^0-9]/g, '');
  if (cleanLocal.startsWith('0')) {
    cleanLocal = cleanLocal.substring(1);
  }
  return `${cleanCode}${cleanLocal}`;
}

/**
 * WhatsApp Deduction Message Generator
 */
export function buildDeductionWhatsAppMessage({
  employeeName,
  deductionAmount,
  reason,
  date,
  basicSalary,
  totalDeductions,
  netSalary,
  factoryName = 'Factory Data',
}: {
  employeeName: string;
  deductionAmount: number;
  reason: string;
  date: string;
  basicSalary: number;
  totalDeductions: number;
  netSalary: number;
  factoryName?: string;
}): string {
  return `السلام عليكم أ/ ${employeeName}،
إشعار بخصوص تسجيل خصم من إدارة *${factoryName}*:

• قيمة الخصم: ${formatCurrency(deductionAmount)}
• سبب الخصم: ${reason}
• تاريخ الخصم: ${formatDate(date)}

بيان الراتب للشهر الحالي:
- الراتب الأساسي: ${formatCurrency(basicSalary)}
- إجمالي الخصومات المسجلة: ${formatCurrency(totalDeductions)}
- صافي الراتب التقديري المتبقي: ${formatCurrency(netSalary)}

نتمنى لكم دوام التوفيق والنجاح.
إدارة المصنع - Factory Data`;
}

/**
 * WhatsApp Payslip Message Generator
 */
export function buildPayslipWhatsAppMessage({
  employeeName,
  basicSalary,
  bonuses,
  deductions,
  netSalary,
  month,
  year,
  paymentDate,
  factoryName = 'Factory Data',
}: {
  employeeName: string;
  basicSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  month: number;
  year: number;
  paymentDate: string;
  factoryName?: string;
}): string {
  return `السلام عليكم أ/ ${employeeName}،
إشعار بصرف الراتب الشهري من إدارة *${factoryName}*:

• فترة الاستحقاق: شهر ${month} / ${year}
• تاريخ الصرف: ${formatDate(paymentDate)}
• الراتب الأساسي: ${formatCurrency(basicSalary)}
• المكافآت والحوافز: +${formatCurrency(bonuses)}
• إجمالي الخصومات: -${formatCurrency(deductions)}
========================
★ صافي الراتب المستلم: ${formatCurrency(netSalary)}

شاكرين لكم مجهوداتكم وإخلاصكم في العمل.
إدارة المصنع - Factory Data`;
}

/**
 * Convert Image File to Base64 String for Offline Storage in IndexedDB
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Export data array to CSV format with UTF-8 BOM for perfect Excel Arabic support
 */
export function exportToExcelCsv(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void {
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Arabic is displayed properly in Excel
  let csvContent = '\uFEFF';

  // Add headers
  csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

  // Add rows
  rows.forEach((row) => {
    const formattedRow = row.map((cell) => {
      if (cell === null || cell === undefined) return '""';
      const cellString = String(cell).replace(/"/g, '""');
      return `"${cellString}"`;
    });
    csvContent += formattedRow.join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger print dialog
 */
export function triggerPrint(): void {
  window.print();
}
