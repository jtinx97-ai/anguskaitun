import React, { useState } from 'react';
import { ShieldCheck, Lock, X, AlertCircle, Loader2, KeyRound } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string, updatedUser?: any) => void;
  currentUserId?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
}) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('กรุณากรอกรหัส PIN ความปลอดภัย');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pin: pin.trim(),
          userId: currentUserId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(pin.trim(), data.user);
        setPin('');
        onClose();
      } else {
        setErrorMsg(data.message || 'รหัสผ่าน Admin PIN ไม่ถูกต้อง');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#180d32] to-[#0d071c] border border-purple-500/40 shadow-2xl p-6 text-center text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)] mb-4">
          <KeyRound className="w-7 h-7 text-white" />
        </div>

        <h3 className="text-lg font-black text-white">
          ยืนยันรหัสความปลอดภัย
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          กรุณากรอกรหัส PIN เพื่อยืนยันสิทธิ์การเข้าถึง
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="password"
              autoFocus
              placeholder="กรอกรหัส PIN ความปลอดภัย"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono tracking-widest text-center"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>ยืนยันรหัสความปลอดภัย</span>
          </button>
        </form>
      </div>
    </div>
  );
};
