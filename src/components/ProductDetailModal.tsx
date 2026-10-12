import React from 'react';
import { 
  X, 
  ShoppingCart, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Lock, 
  Sparkles,
  Info
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  if (!product) return null;

  const isOutOfStock = product.stockCount <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#150b28] via-[#0d071b] to-[#07030e] border border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.3)] p-5 sm:p-7 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Image & Info */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-full sm:w-48 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-[#100720] border border-purple-500/30 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-200 text-xs font-semibold">
                {product.categoryLabel}
              </span>
              {product.badge && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-900/40 text-indigo-200 text-xs font-semibold border border-indigo-500/40">
                  {product.badge}
                </span>
              )}
              {isOutOfStock ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 text-xs font-bold border border-rose-800/40">
                  สินค้าหมดชั่วคราว
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800/40">
                  พร้อมส่ง {product.stockCount} ชิ้น
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {product.name}
            </h2>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-300 font-mono">
                ฿{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-purple-400/50 line-through font-mono">
                  ฿{product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40 ml-2">
                ส่งรหัสออโต้ทันทีหลังชำระเงิน
              </span>
            </div>
          </div>
        </div>

        {/* Detailed specs */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#1a0f35] border border-purple-500/30">
            <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-purple-400" />
              รายละเอียดคุณสมบัติไอดี
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {product.details.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-purple-200/90">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {product.description && (
            <div className="p-4 rounded-2xl bg-[#140b28] border border-purple-500/20 text-xs text-purple-200/80 leading-relaxed">
              <h4 className="font-bold text-white mb-1">คำอธิบายเพิ่มเติม:</h4>
              <p>{product.description}</p>
            </div>
          )}

          {/* Guarantee Box */}
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center gap-3 text-xs text-purple-300/80">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>รับประกันความปลอดภัย 100%:</strong> เมื่อสั่งซื้อระบบจะตัดยอดเงินและส่งข้อมูลรหัสผ่านให้ท่านทันที พร้อมทั้งเก็บบันทึกประวัติในคลังไอดี
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-purple-500/20 flex gap-3">
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            disabled={isOutOfStock}
            className={`flex-1 py-3 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              isOutOfStock
                ? 'border-slate-800 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                : 'border-purple-500/40 bg-[#1a0f35] hover:bg-purple-900/50 text-purple-200 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>ใส่ตะกร้า</span>
          </button>

          <button
            onClick={() => {
              onBuyNow(product);
              onClose();
            }}
            disabled={isOutOfStock}
            className={`flex-1 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(147,51,234,0.4)]'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>ซื้อทันที ฿{product.price.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
