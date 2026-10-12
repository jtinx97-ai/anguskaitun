import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  Wallet, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock
} from 'lucide-react';
import { CartItem, User } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  user: User | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenTopup: () => void;
  onOpenAuth: () => void;
  onCheckout: (couponCode?: string) => Promise<boolean>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  user,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenTopup,
  onOpenAuth,
  onCheckout,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Calculate discount
  let discount = 0;
  if (appliedCoupon === 'ANGUS10') {
    discount = Math.round(subtotal * 0.1);
  } else if (appliedCoupon === 'NEWBIE50' && subtotal >= 200) {
    discount = 50;
  } else if (appliedCoupon === 'VIP20') {
    discount = Math.round(subtotal * 0.2);
  }

  const finalTotal = Math.max(0, subtotal - discount);
  const userBalance = user?.balance || 0;
  const isBalanceSufficient = userBalance >= finalTotal;
  const missingAmount = Math.max(0, finalTotal - userBalance);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'ANGUS10') {
      setAppliedCoupon('ANGUS10');
    } else if (code === 'NEWBIE50') {
      if (subtotal < 200) {
        setCouponError('โค้ดนี้ใช้ได้เมื่อยอดสั่งซื้อครบ 200 บาทขึ้นไป');
        return;
      }
      setAppliedCoupon('NEWBIE50');
    } else if (code === 'VIP20') {
      setAppliedCoupon('VIP20');
    } else {
      setCouponError('โค้ดส่วนลดไม่ถูกต้อง หรือหมดอายุแล้ว');
      return;
    }
  };

  const handleProcessCheckout = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!isBalanceSufficient) {
      onOpenTopup();
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onCheckout(appliedCoupon || undefined);
      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-gradient-to-b from-[#140b28] to-[#07030e] border-l border-purple-500/30 shadow-2xl flex flex-col text-white">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-purple-500/20 flex items-center justify-between bg-[#190e32]/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ตะกร้าสินค้า</h3>
                <p className="text-xs text-purple-300/70">
                  {items.length > 0 ? `${items.reduce((acc, i) => acc + i.quantity, 0)} รายการในตะกร้า` : 'ยังไม่มีสินค้า'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-950/30 transition cursor-pointer"
                  title="ล้างตะกร้าทั้งหมด"
                >
                  ล้างตะกร้า
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-purple-950/60 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-white">ตะกร้าของคุณว่างเปล่า</h4>
                <p className="text-xs text-purple-300/60 max-w-xs">
                  เลือกไอดีเกมที่ต้องการ แล้วกดเพิ่มลงในตะกร้าเพื่อสั่งซื้อพร้อมกัน
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3.5 rounded-2xl bg-[#1a0f35]/80 border border-purple-500/30 hover:border-purple-400/50 transition flex gap-3 items-center"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-purple-500/30"
                  />

                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white truncate">
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-300">
                        ฿{item.product.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-purple-300/60">
                        (คงเหลือ {item.product.stockCount} ชิ้น)
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-[#100720] border border-purple-500/30 rounded-xl p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded text-purple-300 hover:text-white hover:bg-purple-900/50 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockCount}
                          className="p-1 rounded text-purple-300 hover:text-white hover:bg-purple-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-purple-400/60 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                        title="ลบออกจากตะกร้า"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-purple-500/20 bg-[#140b28]/90 space-y-3.5">
              {/* Promo code */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-purple-400" />
                  <input
                    type="text"
                    placeholder="โค้ดส่วนลด (เช่น ANGUS10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full bg-[#1b0f35] border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/50 uppercase font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-semibold border border-purple-500/30 transition cursor-pointer"
                >
                  ใช้โค้ด
                </button>
              </form>

              {couponError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {couponError}
                </p>
              )}

              {appliedCoupon && (
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs text-purple-300 flex items-center justify-between">
                  <span>โค้ด {appliedCoupon} ลด ฿{discount}</span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-purple-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Price summary rows */}
              <div className="space-y-1.5 text-xs text-purple-200/80">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า</span>
                  <span className="font-mono">฿{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>ส่วนลด</span>
                    <span className="font-mono">-฿{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-purple-500/20">
                  <span>ยอดชำระทั้งสิ้น</span>
                  <span className="font-mono text-base text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-300">
                    ฿{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Balance Bar in Checkout */}
              {user && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isBalanceSufficient
                    ? 'bg-[#1b0f35] border-purple-500/30 text-purple-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    <span>เครดิตของคุณ: <strong>฿{userBalance.toLocaleString()}</strong></span>
                  </div>
                  {!isBalanceSufficient && (
                    <button
                      onClick={onOpenTopup}
                      className="text-[11px] font-bold text-amber-300 underline cursor-pointer"
                    >
                      ขาดอีก ฿{missingAmount.toLocaleString()} เติมเงิน
                    </button>
                  )}
                </div>
              )}

              {/* Submit Checkout Button */}
              <button
                onClick={handleProcessCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-purple-300" />
                <span>
                  {isSubmitting
                    ? 'กำลังประมวลผลการสั่งซื้อ...'
                    : !user
                    ? 'เข้าสู่ระบบเพื่อดำเนินการชำระเงิน'
                    : !isBalanceSufficient
                    ? 'เครดิตไม่พอ (คลิกเติมเงินอัตโนมัติ)'
                    : `ยืนยันชำระเงิน ฿${finalTotal.toLocaleString()} และรับไอดีทันที`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
