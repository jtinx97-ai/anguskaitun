import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Wallet, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Calendar, 
  QrCode, 
  Smartphone, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Order, TopupTransaction } from '../types';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  transactions: TopupTransaction[];
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  transactions,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions'>('orders');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (key: string) => {
    setRevealedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#150b28] via-[#0d071c] to-[#07030f] border border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.3)] p-5 sm:p-7 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">คลังไอดีและประวัติธุรกรรม</h2>
            <p className="text-xs text-purple-300/70">
              เรียกดูรหัสไอดีเกมที่สั่งซื้อแล้ว และประวัติการเติมเงินย้อนหลัง
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-2xl bg-purple-950/40 border border-purple-500/20">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>คลังไอดีที่ซื้อแล้ว ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>ประวัติการเติมเงิน ({transactions.length})</span>
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-purple-300/60 text-xs space-y-2">
                <Package className="w-12 h-12 mx-auto text-purple-500/30" />
                <p className="font-semibold text-white">ยังไม่มีประวัติการซื้อไอดี</p>
                <p>เมื่อคุณสั่งซื้อไอดี ข้อมูลรหัสผ่านจะถูกบันทึกและแสดงที่นี่อย่างปลอดภัย</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-[#190e32]/90 border border-purple-500/30 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">#{order.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                        สำเร็จ
                      </span>
                    </div>
                    <span className="text-[11px] text-purple-300/70 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleString('th-TH')}
                    </span>
                  </div>

                  {/* Delivered Items */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => {
                      const itemKey = `${order.id}-${idx}`;
                      const isRevealed = revealedKeys[itemKey];
                      const isCopied = copiedKey === itemKey;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#100720] border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{item.productName}</span>
                            <span className="font-mono text-emerald-300 text-[11px] select-all block mt-1">
                              {isRevealed ? item.credentials : item.credentials.replace(/Pass:\s*([^\s|]+)/i, 'Pass: ••••••••••••')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            <button
                              onClick={() => toggleReveal(itemKey)}
                              className="p-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-300 transition cursor-pointer"
                              title={isRevealed ? 'ซ่อนรหัส' : 'ดูรหัสผ่าน'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopy(item.credentials, itemKey)}
                              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer shadow"
                              title="คัดลอกรหัสผ่าน"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-right text-xs pt-1">
                    <span className="text-purple-300/70">ยอดรวม: </span>
                    <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-300">
                      ฿{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-purple-300/60 text-xs space-y-2">
                <Wallet className="w-12 h-12 mx-auto text-purple-500/30" />
                <p className="font-semibold text-white">ยังไม่มีประวัติการเติมเงิน</p>
                <p>เมื่อคุณเติมเงินผ่าน KBank หรือ TrueMoney ประวัติจะแสดงที่นี่</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-[#190e32] border border-purple-500/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${tx.method === 'slipok_kbank' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                      {tx.method === 'slipok_kbank' ? <QrCode className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">฿{tx.amount.toLocaleString()}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                          tx.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : tx.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {tx.status === 'success' ? 'สำเร็จ' : tx.status === 'pending' ? 'รอตรวจสอบ' : 'ล้มเหลว'}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-300/70 mt-0.5">
                        {tx.method === 'slipok_kbank' ? 'ธนาคารกสิกรไทย (SlipOK)' : 'TrueMoney ซองของขวัญ'} • {new Date(tx.createdAt).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>

                  {tx.transRef && (
                    <span className="text-[10px] text-purple-400/80 font-mono hidden sm:inline">
                      {tx.transRef}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
