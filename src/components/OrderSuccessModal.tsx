import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  X, 
  Package, 
  Sparkles,
  Building2,
  FileText
} from 'lucide-react';
import { Order } from '../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewAllOrders: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewAllOrders,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPlain, setShowPlain] = useState<Record<number, boolean>>({});

  if (!order) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleShow = (index: number) => {
    setShowPlain(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#160c2d] via-[#0d071c] to-[#07030f] border border-purple-500/40 shadow-[0_0_70px_rgba(147,51,234,0.35)] p-6 sm:p-7 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-emerald-500 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.5)]">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-purple-300/80 font-medium">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span>ANGUS ENTERPRISE CO., LTD.</span>
          </div>
          <h2 className="text-2xl font-black text-white">ชำระเงินและส่งมอบไอดีสำเร็จ!</h2>
          <p className="text-xs sm:text-sm text-purple-200/80">
            ระบบจัดส่งข้อมูลรหัสผ่านให้ท่านเรียบร้อยแล้ว (Order #{order.id})
          </p>
        </div>

        {/* Delivered Items List */}
        <div className="space-y-3.5 mb-6">
          <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-purple-400" />
            ข้อมูลไอดีของคุณ (บันทึกหรือคัดลอกเก็บไว้ทันที)
          </h4>

          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#1a0f35] border border-purple-500/40 space-y-2.5 shadow-md"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate">{item.productName}</span>
                <span className="text-[11px] font-mono text-purple-300/70">ไอดีที่ #{idx + 1}</span>
              </div>

              {/* Account Credentials Box */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0f071e] border border-purple-500/30">
                <div className="font-mono text-xs sm:text-sm text-emerald-300 select-all break-all flex-1">
                  {showPlain[idx] ? item.credentials : (
                    <span>
                      {item.credentials.replace(/Pass:\s*([^\s|]+)/i, 'Pass: ••••••••••••')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleShow(idx)}
                    className="p-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 transition cursor-pointer"
                    title={showPlain[idx] ? 'ซ่อนรหัส' : 'แสดงรหัส'}
                  >
                    {showPlain[idx] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleCopy(item.credentials, idx)}
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer shadow"
                    title="คัดลอกรหัสผ่าน"
                  >
                    {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Advisory */}
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 mb-6 text-xs text-amber-200/90 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-200 block mb-0.5">คำแนะนำด้านความปลอดภัย:</span>
            โปรดเข้าสู่ระบบเกมและทำการเปลี่ยนรหัสผ่านทันที พร้อมผูกอีเมลสำรองของท่านเพื่อความปลอดภัยสูงสุด
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            ปิดหน้านี้
          </button>

          <button
            onClick={() => {
              onClose();
              onViewAllOrders();
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs sm:text-sm font-bold transition shadow-[0_0_20px_rgba(147,51,234,0.4)] cursor-pointer flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>ดูคลังไอดีทั้งหมด</span>
          </button>
        </div>
      </div>
    </div>
  );
};
