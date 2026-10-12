import React from 'react';
import { 
  ShoppingCart, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Eye,
  ShieldCheck
} from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  onViewDetails,
}) => {
  const isOutOfStock = product.stockCount <= 0;

  return (
    <div className="group relative rounded-3xl bg-gradient-to-b from-[#150b2b] to-[#0a0515] border border-purple-500/25 hover:border-purple-400/60 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-[0_12px_40px_rgba(147,51,234,0.25)] hover:-translate-y-1">
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Product Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0d071b]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#150b2b] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {product.badge && (
            <span className="px-2.5 py-1 rounded-xl bg-purple-950/85 backdrop-blur-md border border-purple-400/40 text-[11px] font-bold text-purple-200 shadow-md">
              {product.badge}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-[10px] font-medium text-purple-200/80 border border-purple-500/30">
            {product.categoryLabel}
          </span>
        </div>

        {/* Stock status indicator badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-xl bg-rose-950/90 backdrop-blur-md border border-rose-500/50 text-[11px] font-bold text-rose-300 flex items-center gap-1 shadow-md">
              <AlertCircle className="w-3 h-3" />
              สินค้าหมด
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-[11px] font-bold text-emerald-300 flex items-center gap-1 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              พร้อมส่ง: {product.stockCount} ไอดี
            </span>
          )}
        </div>

        {/* Quick View Button */}
        <button
          onClick={() => onViewDetails(product)}
          className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-[#1c0f38]/85 backdrop-blur-md text-purple-300 border border-purple-500/30 opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-purple-900 hover:text-white cursor-pointer shadow-md"
          title="ดูรายละเอียดเพิ่มเติม"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 
            onClick={() => onViewDetails(product)}
            className="font-bold text-sm sm:text-base text-white group-hover:text-purple-300 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {product.name}
          </h3>

          <p className="mt-1.5 text-xs text-purple-200/60 line-clamp-2 font-normal">
            {product.description}
          </p>

          {/* Key Highlights */}
          <div className="mt-3 space-y-1.5">
            {product.details.slice(0, 3).map((detail, idx) => (
              <div key={idx} className="flex items-center text-[11px] text-purple-200/80 gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="truncate">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Action area */}
        <div className="pt-3 border-t border-purple-500/20">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] text-purple-300/70 uppercase tracking-wider block font-medium">ราคาพิเศษ</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 font-mono">
                  ฿{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-purple-400/50 line-through font-mono">
                    ฿{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <span className="text-[10px] text-purple-300 font-medium bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" /> รับประกัน 100%
            </span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isOutOfStock
                  ? 'border-slate-800 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                  : 'border-purple-500/40 bg-[#190e32] hover:bg-purple-900/50 text-purple-200 hover:text-white hover:border-purple-400 active:scale-95'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>ใส่ตะกร้า</span>
            </button>

            <button
              onClick={() => onBuyNow(product)}
              disabled={isOutOfStock}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.35)] active:scale-95'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>ซื้อทันที</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
