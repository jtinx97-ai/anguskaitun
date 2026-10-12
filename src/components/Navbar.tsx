import React from 'react';
import { 
  ShoppingCart, 
  Wallet, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Package, 
  Sparkles,
  Building2,
  Database,
  CheckCircle2
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTopup: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  onOpenCart,
  onOpenTopup,
  onOpenOrders,
  onOpenAdmin,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0c061a]/90 border-b border-purple-500/20 shadow-[0_4px_30px_rgba(147,51,234,0.12)]">
      {/* Top micro corporate bar */}
      <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/60 to-purple-950/80 border-b border-purple-500/20 text-xs py-1.5 px-4 text-purple-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium text-purple-100">
              ⚡ ANGUS ENTERPRISE • ระบบเติมเงินอัตโนมัติ 24 ชม. (SlipOK KBank 1668303060 & TrueMoney 082-984-8852)
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-purple-300/80">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>จดทะเบียนพาณิชย์ดิจิทัล (DBD Registered)</span>
            </span>
            <span className="text-purple-500/40">|</span>
            <span className="text-purple-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>ความปลอดภัย SSL 256-Bit</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1c0f38] to-[#0d071a] border border-purple-400/40 flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-purple-300 group-hover:scale-110 transition transform" />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                AngusShopX
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 font-normal">
              บริษัท แองกัส ดิจิทัล เอ็นเตอร์ไพรส์ จำกัด
            </p>
          </div>
        </div>

        {/* Right action area */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* User Balance & Top-up */}
          {user ? (
            <div className="flex items-center bg-[#170c2e]/90 border border-purple-500/30 rounded-2xl p-1 pl-3 shadow-inner">
              <div className="mr-2 text-right">
                <span className="block text-[10px] text-purple-300/70 uppercase font-medium">เครดิตคงเหลือ</span>
                <span className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-300 font-mono">
                  ฿{user.balance.toLocaleString()}
                </span>
              </div>
              <button
                onClick={onOpenTopup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-[0_0_15px_rgba(147,51,234,0.4)] transition transform active:scale-95 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>เติมเงิน</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenTopup}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#170c2e] border border-purple-500/40 text-purple-200 hover:bg-[#221045] text-xs sm:text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              <Wallet className="w-4 h-4 text-purple-400" />
              <span>เติมเงิน</span>
            </button>
          )}

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-2xl bg-[#170c2e] border border-purple-500/30 hover:border-purple-400/60 text-purple-200 hover:text-white transition cursor-pointer group"
            title="ตะกร้าสินค้า"
          >
            <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition transform text-purple-300" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* User profile / Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenOrders}
                className="p-2.5 rounded-2xl bg-[#170c2e] border border-purple-500/30 hover:border-purple-400/60 text-purple-200 hover:text-white transition cursor-pointer"
                title="คลังไอดี & ประวัติสั่งซื้อ"
              >
                <Package className="w-5 h-5 text-indigo-300" />
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={onOpenAdmin}
                  className="px-3 py-2 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-200 hover:bg-purple-900/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="จัดการระบบร้านค้า"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span className="hidden md:inline">จัดการร้าน</span>
                </button>
              )}

              {/* User Dropdown / Menu */}
              <div className="relative group">
                <div className="flex items-center gap-2 pl-1 cursor-pointer">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                    alt={user.name}
                    className="w-9 h-9 rounded-2xl border border-purple-400/50 object-cover shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  />
                  <div className="hidden lg:block text-left">
                    <span className="text-xs font-bold text-white block max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-purple-300/70 block">
                      {user.role === 'admin' ? 'เจ้าของร้าน' : 'สมาชิกระดับ VIP'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#140b28] border border-purple-500/30 shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-50">
                  <div className="px-4 py-2 border-b border-purple-500/20 text-xs text-purple-200">
                    <p className="font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-purple-400/70 truncate font-mono">{user.email}</p>
                  </div>

                  <button
                    onClick={onOpenOrders}
                    className="w-full px-4 py-2 text-left text-xs text-purple-200 hover:bg-purple-900/40 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>ไอดีที่ซื้อแล้ว</span>
                  </button>

                  <button
                    onClick={onOpenTopup}
                    className="w-full px-4 py-2 text-left text-xs text-purple-200 hover:bg-purple-900/40 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>เติมเงินเข้ากระเป๋า</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={onOpenAdmin}
                      className="w-full px-4 py-2 text-left text-xs text-purple-300 hover:bg-purple-900/40 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span>จัดการสต็อกสินค้า</span>
                    </button>
                  )}

                  <div className="border-t border-purple-500/20 mt-1 pt-1">
                    <button
                      onClick={onLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] transition transform active:scale-95 cursor-pointer flex items-center gap-2 border border-slate-200"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
