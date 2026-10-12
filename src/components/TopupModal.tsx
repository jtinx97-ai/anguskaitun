import React, { useState, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Upload, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  HelpCircle, 
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Lock,
  SendHorizontal
} from 'lucide-react';
import { User } from '../types';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onTopupSuccess: (amount: number, newBalance: number) => void;
  onOpenAuth: () => void;
}

export const TopupModal: React.FC<TopupModalProps> = ({
  isOpen,
  onClose,
  user,
  onTopupSuccess,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'kbank' | 'truemoney'>('kbank');
  
  // SlipOK state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [slipResult, setSlipResult] = useState<{ 
    success: boolean; 
    message: string; 
    amount?: number;
    canSubmitReview?: boolean;
    pending?: boolean;
  } | null>(null);
  const [claimedAmount, setClaimedAmount] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // TrueMoney state
  const [voucherUrl, setVoucherUrl] = useState('');
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState(false);
  const [voucherResult, setVoucherResult] = useState<{ success: boolean; message: string; amount?: number } | null>(null);
  const [showVoucherGuide, setShowVoucherGuide] = useState(false);

  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'bank' | 'promptpay' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else if (type === 'promptpay') {
      setCopiedPromptPay(true);
      setTimeout(() => setCopiedPromptPay(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
      setSlipResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
      setSlipResult(null);
    }
  };

  // Submit SlipOK (Real verification)
  const handleVerifySlip = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!slipFile) {
      setSlipResult({ success: false, message: 'กรุณาอัปโหลดรูปภาพสลิปการโอนเงินของท่าน' });
      return;
    }

    setIsVerifyingSlip(true);
    setSlipResult(null);

    try {
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('userId', user.id);

      const res = await fetch('/api/topup/slipok', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setSlipResult({
          success: true,
          message: data.message || `ตรวจสอบสลิปถูกต้อง เติมเงิน ฿${data.amount} เข้ากระเป๋าเรียบร้อย!`,
          amount: data.amount,
        });
        onTopupSuccess(data.amount, data.newBalance);
        setSlipFile(null);
        setSlipPreview(null);
      } else {
        setSlipResult({
          success: false,
          message: data.message || 'ไม่สามารถตรวจสอบสลิปอัตโนมัติได้ (ภาพไม่ชัด หรือไม่มี QR Code)',
          canSubmitReview: true,
        });
      }
    } catch (err: any) {
      setSlipResult({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ SlipOK',
        canSubmitReview: true,
      });
    } finally {
      setIsVerifyingSlip(false);
    }
  };

  // Fallback: Submit slip for Admin Review
  const handleSubmitForReview = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!slipFile) {
      setSlipResult({ success: false, message: 'กรุณาอัปโหลดรูปภาพสลิป' });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('userId', user.id);
      formData.append('submitReview', 'true');
      formData.append('claimedAmount', claimedAmount || '0');

      const res = await fetch('/api/topup/slipok', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setSlipResult({
          success: true,
          pending: true,
          message: data.message || 'ส่งสลิปให้แอดมินตรวจสอบเรียบร้อยแล้ว แอดมินจะตรวจสอบและอนุมัติเครดิตเข้ากระเป๋าของคุณโดยเร็วที่สุด',
        });
        setSlipFile(null);
        setSlipPreview(null);
      } else {
        setSlipResult({
          success: false,
          message: data.message || 'เกิดข้อผิดพลาดในการส่งสลิปให้แอดมิน',
        });
      }
    } catch (err: any) {
      setSlipResult({
        success: false,
        message: err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Submit TrueMoney Voucher (Real redemption)
  const handleRedeemVoucher = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!voucherUrl) {
      setVoucherResult({ success: false, message: 'กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet' });
      return;
    }

    setIsRedeemingVoucher(true);
    setVoucherResult(null);

    try {
      const res = await fetch('/api/topup/truemoney', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherUrl,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVoucherResult({
          success: true,
          message: data.message || `เติมเงินสำเร็จ ฿${data.amount} เข้าสู่กระเป๋าเรียบร้อย!`,
          amount: data.amount,
        });
        onTopupSuccess(data.amount, data.newBalance);
        setVoucherUrl('');
      } else {
        setVoucherResult({
          success: false,
          message: data.message || 'ไม่สามารถรับเงินจากซองของขวัญได้ กรุณาตรวจสอบลิงก์ซองว่าถูกต้องและยังไม่หมดอายุ',
        });
      }
    } catch (err: any) {
      setVoucherResult({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ TrueMoney',
      });
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#140b26] via-[#0d071a] to-[#07030e] border border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.3)] p-5 sm:p-7 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title & Corporate Badge */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">ระบบเติมเงินอัตโนมัติ</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> บริษัท ปลอดภัย 100%
              </span>
            </div>
            <p className="text-xs text-purple-200/70 mt-0.5">
              ตรวจสลิปอัตโนมัติตลอด 24 ชม. ผ่าน SlipOK KBank และ TrueMoney Wallet
            </p>
          </div>
        </div>

        {/* User Balance Info Bar */}
        <div className="mb-5 p-3.5 rounded-2xl bg-[#1b0f35]/80 border border-purple-500/30 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-xs text-purple-200 font-medium">
              {user ? `บัญชี: ${user.name || user.email}` : 'ยังไม่ได้เข้าสู่ระบบ'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-purple-300/70 block uppercase font-medium">ยอดเงินคงเหลือปัจจุบัน</span>
            <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-300 font-mono">
              ฿{user?.balance.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-2xl bg-purple-950/40 border border-purple-500/20">
          <button
            onClick={() => setActiveTab('kbank')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'kbank'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>ธนาคารกสิกรไทย / พร้อมเพย์</span>
          </button>

          <button
            onClick={() => setActiveTab('truemoney')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'truemoney'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>TrueMoney ซองของขวัญ</span>
          </button>
        </div>

        {/* TAB 1: KBANK SLIPOK */}
        {activeTab === 'kbank' && (
          <div className="space-y-4">
            {/* Bank details card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#122e23] via-[#0b1f17] to-[#07130f] border border-emerald-500/40 p-4 sm:p-5 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                    KBANK
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">ธนาคารกสิกรไทย (KASIKORNBANK)</span>
                    <span className="text-[10px] text-emerald-200/60">บัญชีทางการของร้าน</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-600/40 text-emerald-300 font-semibold flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3" /> ตรวจสอบสลิป SlipOK 24 ชม.
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <span className="text-[10px] text-emerald-200/70 uppercase font-semibold">เลขที่บัญชีกสิกรไทย</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl sm:text-2xl font-mono font-black tracking-wider text-emerald-100">
                      166-8-30306-0
                    </span>
                    <button
                      onClick={() => handleCopy('1668303060', 'bank')}
                      className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-600/40 transition cursor-pointer"
                      title="คัดลอกเลขบัญชี"
                    >
                      {copiedBank ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-200/90 font-medium mt-1">
                    ชื่อบัญชี: <span className="font-bold text-white">นาย กฤติน สุโขพล</span>
                  </p>
                </div>

                {/* PromptPay info */}
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-600/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 font-semibold uppercase block">เบอร์พร้อมเพย์ (PromptPay)</span>
                    <span className="text-sm font-mono font-bold text-white">082-984-8852</span>
                  </div>
                  <button
                    onClick={() => handleCopy('0829848852', 'promptpay')}
                    className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-600/40 transition cursor-pointer text-xs"
                    title="คัดลอกเบอร์พร้อมเพย์"
                  >
                    {copiedPromptPay ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Slip Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-5 text-center bg-purple-950/20 hover:bg-purple-950/40 transition cursor-pointer relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {slipPreview ? (
                <div className="space-y-3">
                  <div className="relative max-h-52 max-w-xs mx-auto rounded-xl overflow-hidden border border-purple-500/50 shadow-lg">
                    <img src={slipPreview} alt="Slip Preview" className="w-full h-auto object-contain max-h-52" />
                    {isVerifyingSlip && (
                      <div className="absolute inset-0 bg-purple-950/75 flex flex-col items-center justify-center p-3">
                        <div className="w-full h-1 bg-purple-400 animate-pulse shadow-[0_0_10px_#a855f7]" />
                        <Loader2 className="w-8 h-8 text-purple-300 animate-spin mt-2" />
                        <span className="text-xs text-purple-200 font-bold mt-2">SlipOK กำลังสแกน QR Code...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-purple-300 font-medium">
                    คลิกเพื่อเปลี่ยนรูปสลิป หรือลากไฟล์สลิปมาวางใหม่
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/40 mx-auto flex items-center justify-center text-purple-400 shadow-md">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    คลิกอัปโหลด หรือลากภาพสลิปธนาคารมาวางที่นี่
                  </p>
                  <p className="text-xs text-purple-200/60 max-w-md mx-auto">
                    รองรับภาพสลิปที่มี QR Code ชัดเจน ระบบเชื่อมต่อ SlipOK ตรวจสอบและเพิ่มเงินเข้าบัญชีทันที 100%
                  </p>
                </div>
              )}
            </div>

            {/* Verification Result Message */}
            {slipResult && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
                  slipResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                }`}
              >
                {slipResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold">
                    {slipResult.pending ? 'ส่งสลิปให้แอดมินเรียบร้อย!' : slipResult.success ? 'ทำรายการสำเร็จ!' : 'ตรวจสอบสลิปไม่สำเร็จ'}
                  </p>
                  <p className="mt-0.5 text-xs opacity-90 leading-relaxed">{slipResult.message}</p>

                  {/* Fallback Option: Send to Admin Review if SlipOK failed */}
                  {slipResult.canSubmitReview && !slipResult.pending && (
                    <div className="mt-3 pt-3 border-t border-rose-800/40 space-y-2">
                      <p className="text-xs text-rose-300 font-medium">
                        หากคุณโอนเงินจริงแต่ระบบตรวจ QR Code ไม่ผ่าน สามารถส่งสลิปให้แอดมินตรวจสอบยอดเงินได้ทันที:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="ระบุยอดเงินที่โอน (บาท)"
                          value={claimedAmount}
                          onChange={(e) => setClaimedAmount(e.target.value)}
                          className="w-40 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                        <button
                          onClick={handleSubmitForReview}
                          disabled={isSubmittingReview}
                          className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5" />}
                          <span>ส่งให้แอดมินอนุมัติ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleVerifySlip}
              disabled={isVerifyingSlip || !slipFile}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifyingSlip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังเชื่อมต่อ SlipOK ตรวจสอบสลิปจริง...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ตรวจสอบสลิปและเติมเงินเข้ากระเป๋าทันที</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 2: TRUEMONEY WALLET VOUCHER */}
        {activeTab === 'truemoney' && (
          <div className="space-y-4">
            {/* TrueMoney details card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#3b1d07] via-[#241103] to-[#120801] border border-amber-500/40 p-4 sm:p-5 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                    TM
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">TrueMoney Wallet (ซองของขวัญ)</span>
                    <span className="text-[10px] text-amber-200/60">รับเงินเข้าเบอร์ร้านอัตโนมัติ</span>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-950 px-2.5 py-1 rounded-full border border-amber-600/40 text-amber-300 font-semibold">
                  อัตโนมัติ 100%
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-[10px] text-amber-200/70 uppercase font-semibold">เบอร์ทรูมันนี่วอลเล็ทร้าน</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl sm:text-2xl font-mono font-black tracking-wider text-amber-100">
                      082-984-8852
                    </span>
                    <button
                      onClick={() => handleCopy('0829848852', 'phone')}
                      className="p-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-600/40 transition cursor-pointer"
                      title="คัดลอกเบอร์โทรศัพท์"
                    >
                      {copiedPhone ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium mt-1">
                    ระบบจะใช้เบอร์นี้ไปกดรับซองของขวัญและเติมยอดเงินจริงให้คุณทันที
                  </p>
                </div>
              </div>
            </div>

            {/* Voucher input form */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-purple-200">
                วางลิงก์ซองของขวัญ TrueMoney Wallet ที่นี่
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://gift.truemoney.com/campaign/?v=xxxxxx"
                  value={voucherUrl}
                  onChange={(e) => setVoucherUrl(e.target.value)}
                  className="w-full bg-[#160c2b] border border-amber-500/40 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Guide Accordion */}
            <div className="border border-purple-500/20 rounded-2xl bg-purple-950/30 overflow-hidden">
              <button
                onClick={() => setShowVoucherGuide(!showVoucherGuide)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs text-amber-400 hover:text-amber-300 transition cursor-pointer font-semibold"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  วิธีสร้างซองของขวัญ TrueMoney Wallet (คลิกดูคำแนะนำ)
                </span>
                {showVoucherGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showVoucherGuide && (
                <div className="p-4 border-t border-purple-900/40 text-xs text-purple-200/80 space-y-2.5 bg-[#120822]/60">
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 text-[11px]">1</span>
                    <p>เปิดแอป <strong>TrueMoney Wallet</strong> เลื่อนลงมาที่เมนู <strong>"ส่งซองของขวัญ"</strong></p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 text-[11px]">2</span>
                    <p>กรอกจำนวนเงินที่ต้องการเติม เลือกประเภทซองเป็น <strong>"แบ่งจำนวนเงินเท่ากัน"</strong></p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 text-[11px]">3</span>
                    <p>ใส่จำนวนคนรับซองเป็น <strong>"1 คน"</strong> แล้วกดยืนยันสร้างซอง</p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 text-[11px]">4</span>
                    <p>กด <strong>"คัดลอกลิงก์"</strong> นำมาวางในช่องด้านบน แล้วกดยืนยันเติมเงินได้ทันที!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Result Message */}
            {voucherResult && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
                  voucherResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                }`}
              >
                {voucherResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{voucherResult.success ? 'เติมเงินสำเร็จ!' : 'เกิดข้อผิดพลาด'}</p>
                  <p className="mt-0.5 text-xs opacity-90">{voucherResult.message}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleRedeemVoucher}
              disabled={isRedeemingVoucher || !voucherUrl}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isRedeemingVoucher ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังเชื่อมต่อ TrueMoney รับเงินจริง...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ตรวจสอบและรับเงินเข้ากระเป๋าทันที</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Corporate Trust Footer in Modal */}
        <div className="mt-5 pt-4 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-purple-300/60">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>เข้ารหัสระดับ SSL 256-Bit</span>
          </div>
          <span>ฝ่ายบริการลูกค้า 24 ชม.</span>
        </div>
      </div>
    </div>
  );
};
