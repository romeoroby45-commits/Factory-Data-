import React, { useState, useEffect } from 'react';
import { Send, X, Copy, Check } from 'lucide-react';
import { cleanPhoneNumber } from '../utils/helpers';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  countryCode: string;
  phone: string;
  initialMessage: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  countryCode,
  phone,
  initialMessage,
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  if (!isOpen) return null;

  const fullPhone = cleanPhoneNumber(countryCode, phone);

  const handleSend = () => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${fullPhone}?text=${encoded}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h3 className="text-base font-bold text-white">إرسال رسالة واتساب</h3>
              <p className="text-xs text-[#B0B0B0]">
                الموظف: <span className="text-white font-medium">{employeeName}</span> ({countryCode} {phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#B0B0B0] hover:text-white rounded-lg hover:bg-[#1f1f1f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#B0B0B0] mb-2">
              نص الرسالة (يمكنك التعديل قبل الإرسال):
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-[#000000] border border-[#27272a] rounded-lg text-white text-sm focus:outline-none focus:border-[#007BFF] transition-colors resize-none leading-relaxed"
              placeholder="اكتب نص الرسالة هنا..."
            />
          </div>

          <div className="bg-[#050505] p-3 rounded-lg border border-[#222222] text-xs text-[#B0B0B0] flex items-center justify-between">
            <span>الرقم المستهدف: {fullPhone}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-[#007BFF] hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'تم النسخ' : 'نسخ النص'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#222222] bg-[#0a0a0a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#B0B0B0] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#007BFF] hover:bg-[#0056B3] active:bg-[#004494] rounded-lg shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
            فتح واتساب والإرسال
          </button>
        </div>
      </div>
    </div>
  );
};
