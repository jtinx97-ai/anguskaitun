import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  QrCode, 
  Smartphone, 
  Sparkles,
  ChevronRight,
  Swords,
  Lock,
  Building2,
  Award,
  Flame
} from 'lucide-react';

interface HeroBannerProps {
  onOpenTopup: () => void;
  onExploreProducts: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenTopup,
  onExploreProducts,
}) => {
  return (
    <div className="relative overflow-hidden py-10 sm:py-16">
      {/* Background Royal Violet Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-tr from-purple-700/25 via-violet-600/20 to-fuchsia-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Corporate Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-semibold backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)]">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>ANGUS ENTERPRISE CO., LTD. • ศูนย์รวมไอดีเกมอันดับ 1 ของไทย</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              บริษัทจำหน่ายไอดีเกม <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-400 drop-shadow-[0_0_35px_rgba(192,132,252,0.4)]">
                ระบบจัดส่งอัตโนมัติ 24 ชม.
              </span>
            </h1>

            <p className="text-purple-200/80 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              แพลตฟอร์มจำหน่ายไอดีเกมและดิจิทัลแอคเคาท์ระดับพรีเมียมที่ได้มาตรฐาน Blox Fruits หมัดก็อดฮิวแมน, ดาบคู่ CDK, เผ่า V4 ขั้นเต็ม Full Gear, ผลคิทสึเนะ Kitsune ตลอดจนไอดีเกม RoV, Valorant และ Roblox รหัสสะอาด 100% รับประกันความปลอดภัย จัดส่งอัตโนมัติทันทีหลังชำระเงิน
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreProducts}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(147,51,234,0.45)] transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>เลือกซื้อไอดีพร้อมส่ง</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenTopup}
                className="px-6 py-3.5 rounded-2xl bg-[#170c2e]/90 hover:bg-[#201040] border border-purple-500/40 text-purple-200 font-semibold text-sm transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-purple-400" />
                <span>เติมเงิน KBank / TrueMoney</span>
              </button>
            </div>

            {/* Trust highlights */}
            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-purple-500/20 max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-300 font-mono">25,000+</span>
                <span className="text-[11px] text-purple-300/70 font-medium">คำสั่งซื้อสำเร็จ</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">100%</span>
                <span className="text-[11px] text-purple-300/70 font-medium">ส่งรหัสอัตโนมัติ</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-lg sm:text-2xl font-black text-violet-300 font-mono">24 ชม.</span>
                <span className="text-[11px] text-purple-300/70 font-medium">ตรวจสลิปอัตโนมัติ</span>
              </div>
            </div>
          </div>

          {/* Right Card: Official Payment Gateway Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-gradient-to-b from-[#1a0f35]/90 to-[#0e071e]/95 border border-purple-500/30 p-6 shadow-[0_15px_50px_rgba(147,51,234,0.2)] backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className="font-bold text-white text-sm">ช่องทางชำระเงินของบริษัท</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ออนไลน์ 100%
                </span>
              </div>

              {/* Payment methods preview */}
              <div className="space-y-3.5 mt-4">
                {/* Kasikorn / SlipOK */}
                <div 
                  onClick={onOpenTopup}
                  className="p-3.5 rounded-2xl bg-[#140b28] border border-emerald-500/30 hover:border-emerald-400/60 transition cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">ธนาคารกสิกรไทย (KBANK)</span>
                          <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded border border-purple-600/40">SlipOK API</span>
                        </div>
                        <p className="text-xs text-purple-200/70 font-mono">166-8-30306-0 • กฤตินสุโขพล</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition flex items-center">
                      โอนเงิน <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>
                </div>

                {/* TrueMoney Wallet */}
                <div 
                  onClick={onOpenTopup}
                  className="p-3.5 rounded-2xl bg-[#140b28] border border-amber-500/30 hover:border-amber-400/60 transition cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">TrueMoney Wallet (ซองของขวัญ)</span>
                        </div>
                        <p className="text-xs text-purple-200/70 font-mono">เบอร์ 082-984-8852 • รับเงินทันที</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition flex items-center">
                      ส่งซอง <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="mt-5 pt-4 border-t border-purple-500/20 grid grid-cols-2 gap-3 text-xs text-purple-200/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>รับประกันไอดีปลอดภัย 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>ระบบส่งรหัสแบบเรียลไทม์</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
