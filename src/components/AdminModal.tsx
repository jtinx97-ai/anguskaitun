import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Settings, 
  Database, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  RefreshCw,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  SendHorizontal,
  ExternalLink
} from 'lucide-react';
import { Product, StoreConfig, TopupTransaction } from '../types';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSchema';
import { saveSupabaseConfig } from '../lib/supabase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  config: StoreConfig;
  onUpdateConfig: (config: Partial<StoreConfig> & { newAdminPin?: string }) => Promise<boolean>;
  adminPin: string;
}

interface StockItem {
  id: string;
  productId: string;
  credentials: string;
  addedAt: string;
  isUsed: boolean;
  orderId?: string;
}

const GAME_PRESETS = [
  {
    id: 'bloxfruits',
    name: 'Blox Fruits (ไก่ตันหมัดก็อด + CDK + V4)',
    category: 'godhuman',
    categoryLabel: 'หมัดก็อด + CDK',
    price: 150,
    badge: 'ยอดนิยม 🔥',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    details: ['เลเวลตัน 2550', 'หมัดก็อดฮิวแมน', 'ดาบคู่ CDK แท้', 'ไม่ติดเมล ไม่ติดเบอร์ สะอาด 100%'],
    description: 'รหัสไก่ตัน Blox Fruits สเปกโหด หมัดก็อดฮิวแมน + ดาบคู่ CDK เลเวลตัน พร้อมลงสงคราม PVP จัดส่งทันที',
  },
  {
    id: 'kitsune',
    name: 'Blox Fruits (ผลคิทสึเนะ Kitsune / โมจิตื่น)',
    category: 'mythical',
    categoryLabel: 'ผลปีศาจตื่น (Kitsune/Mochi)',
    price: 250,
    badge: 'ผลในกระเป๋า 🦊',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    details: ['ผล Kitsune ถาวร หรือในกระเป๋า', 'เลเวลตัน 2550', 'เงินเหลือเยอะ สุ่มผลได้', 'ไอดีสะอาด ไม่ติดเมล'],
    description: 'ไอดีไก่ตันสายผลปีศาจ ผลคิทสึเนะสุดแรร์ สกิลสุดอลังการ เลเวลตัน สะอาดปลอดภัย 100%',
  },
  {
    id: 'v4full',
    name: 'Blox Fruits (เผ่า V4 ขั้นเต็ม Full Gear ทุกเผ่า)',
    category: 'v4',
    categoryLabel: 'เผ่า V4 ขั้นเต็ม Full Gear',
    price: 320,
    badge: 'Full Gear ⚡',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    details: ['เผ่า V4 ขั้นเต็ม เกียร์ตัน', 'เลเวลตัน 2550', 'หมัดก็อดฮิวแมนครบ', 'ไอดีปลอดภัย 100%'],
    description: 'ไอดีเผ่า V4 ขั้นเต็ม Full Gear แปลงร่างเท่สุดพลัง เลเวลตัน สกิลครบพร้อมเล่น',
  },
  {
    id: 'valorant',
    name: 'Valorant (ไอดีมีดพรีเมียม / สกิน Vandal แรร์)',
    category: 'budget',
    categoryLabel: 'ไอดี Valorant พรีเมียม',
    price: 390,
    badge: 'แรร์สกิน 🎯',
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=800&q=80',
    details: ['แรงค์พร้อมเล่น', 'สกินปืน Vandal พรีเมียม', 'เปลี่ยนเมลและรหัสผ่านได้ทันที', 'รับประกันปลอดภัย'],
    description: 'ไอดี Valorant สกินสวย เปลี่ยนรหัสผ่านและเมลส่วนตัวได้ทันที 100%',
  },
  {
    id: 'rov',
    name: 'RoV (ไอดีรูนเต็ม 30 แผ่น + สกิน Legend/Supreme)',
    category: 'budget',
    categoryLabel: 'ไอดี RoV แท้',
    price: 290,
    badge: 'รูนเต็ม ⚔️',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    details: ['รูนเลเวล 90 ครบทุกสาย', 'ฮีโร่และสกินระดับพรีเมียม', 'สะอาด ไม่ติดยืนยันตัวตน', 'ส่งมอบอัตโนมัติ'],
    description: 'ไอดี RoV สำหรับสายลงแรงค์ รูนครบเซ็ต สกินสวย ล็อกอินเล่นได้ทันที',
  },
  {
    id: 'roblox_robux',
    name: 'Roblox (ไอดีพร้อม Robux / ของแต่งตัวแรร์)',
    category: 'random',
    categoryLabel: 'Roblox Account',
    price: 180,
    badge: 'พร้อม Robux 💎',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    details: ['มี Robux คงเหลือ', 'ของแต่งตัวพร้อมใช้งาน', 'อายุไอดีเกิน 1 ปี', 'สะอาด 100%'],
    description: 'ไอดี Roblox สะอาด ปลอดภัย มีของสะสมและไอเทมในตัว',
  },
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  config,
  onUpdateConfig,
  adminPin,
}) => {
  const [activeTab, setActiveTab] = useState<'quick-add' | 'inventory' | 'products' | 'finance' | 'settings'>('quick-add');
  
  // QUICK ADD STATE
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bloxfruits');
  const [quickName, setQuickName] = useState(GAME_PRESETS[0].name);
  const [quickPrice, setQuickPrice] = useState(GAME_PRESETS[0].price);
  const [quickCategory, setQuickCategory] = useState(GAME_PRESETS[0].category);
  const [quickCategoryLabel, setQuickCategoryLabel] = useState(GAME_PRESETS[0].categoryLabel);
  const [quickImage, setQuickImage] = useState(GAME_PRESETS[0].image);
  const [quickBadge, setQuickBadge] = useState(GAME_PRESETS[0].badge);
  const [quickCredentials, setQuickCredentials] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickMessage, setQuickMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // INVENTORY & STOCK MANAGEMENT STATE
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [deletingStockId, setDeletingStockId] = useState<string | null>(null);
  const [copiedStockId, setCopiedStockId] = useState<string | null>(null);

  // Bulk add to existing product
  const [rawStockInput, setRawStockInput] = useState('');
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [stockMessage, setStockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PRODUCT EDIT / DELETE STATE
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // TRANSACTIONS STATE
  const [transactions, setTransactions] = useState<TopupTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [approvingTxId, setApprovingTxId] = useState<string | null>(null);
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [manualApprovalAmount, setManualApprovalAmount] = useState<Record<string, string>>({});

  // SETTINGS STATE
  const [bankAccount, setBankAccount] = useState(config.bankAccount);
  const [bankAccountName, setBankAccountName] = useState(config.bankAccountName);
  const [truemoneyPhone, setTruemoneyPhone] = useState(config.truemoneyPhone);
  const [slipokApiKey, setSlipokApiKey] = useState(config.slipokApiKey);
  const [slipokApiUrl, setSlipokApiUrl] = useState(config.slipokApiUrl);
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl || 'https://anguskaituntheshop.supabase.co');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.supabaseAnonKey || '');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  // Supabase test and sync state
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    connected: boolean;
    allTablesExist?: boolean;
    message: string;
    tables?: Record<string, boolean>;
    missingTables?: string[];
    localUsersCount?: number;
    syncedUsersCount?: number;
    googleCallbackUrl?: string;
  } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncSupabaseMessage, setSyncSupabaseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCallbackUrl, setCopiedCallbackUrl] = useState(false);
  const [adminToast, setAdminToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showAdminToast = (text: string, type: 'success' | 'error' = 'success') => {
    setAdminToast({ text, type });
    setTimeout(() => setAdminToast(null), 3500);
  };

  // Sync selectedProductId if empty
  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Fetch stock when selectedProductId changes or tab is inventory
  const fetchProductStock = async (productId: string) => {
    if (!productId) return;
    setIsLoadingStock(true);
    try {
      const res = await fetch(`/api/products/${productId}/stock`);
      const data = await res.json();
      if (data.success && data.stock) {
        setStockList(data.stock);
      } else {
        setStockList([]);
      }
    } catch (err) {
      console.error(err);
      setStockList([]);
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory' && selectedProductId) {
      fetchProductStock(selectedProductId);
    }
  }, [activeTab, selectedProductId]);

  // Fetch transactions when finance tab is open
  const fetchTransactions = async () => {
    setIsLoadingTx(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        headers: { 'x-admin-pin': adminPin },
      });
      const data = await res.json();
      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'finance') {
      fetchTransactions();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = GAME_PRESETS.find(x => x.id === presetId);
    if (p) {
      setQuickName(p.name);
      setQuickPrice(p.price);
      setQuickCategory(p.category);
      setQuickCategoryLabel(p.categoryLabel);
      setQuickImage(p.image);
      setQuickBadge(p.badge);
    }
  };

  // Submit Quick Add (Product + Stock in 1-Click)
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickPrice) {
      setQuickMessage({ type: 'error', text: 'กรุณากรอกชื่อสินค้าและราคา' });
      return;
    }

    setIsQuickAdding(true);
    setQuickMessage(null);

    const preset = GAME_PRESETS.find(x => x.id === selectedPresetId);

    try {
      const res = await fetch('/api/products/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({
          name: quickName.trim(),
          price: Number(quickPrice),
          category: quickCategory,
          categoryLabel: quickCategoryLabel,
          image: quickImage,
          badge: quickBadge,
          credentials: quickCredentials.trim(),
          description: preset?.description || 'ไอดีคุณภาพ จัดส่งอัตโนมัติทันทีหลังชำระเงิน',
          details: preset?.details || ['ไอดีสะอาด 100%', 'จัดส่งอัตโนมัติ'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuickMessage({
          type: 'success',
          text: data.message || `เพิ่มไอดี "${quickName}" เรียบร้อย!`,
        });
        setQuickCredentials('');
        onRefreshProducts();
        if (data.product?.id) {
          setSelectedProductId(data.product.id);
        }
      } else {
        setQuickMessage({ type: 'error', text: data.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' });
      }
    } catch (err: any) {
      setQuickMessage({ type: 'error', text: err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ' });
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Delete Individual Stock Item (CRITICAL FIX FOR USER)
  const handleDeleteStockItem = async (stockId: string) => {
    if (!selectedProductId) return;
    setDeletingStockId(stockId);
    try {
      const res = await fetch(`/api/products/${selectedProductId}/stock/${stockId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin },
      });
      const data = await res.json();
      if (data.success) {
        setStockList(prev => prev.filter(item => item.id !== stockId));
        onRefreshProducts();
        showAdminToast('ลบไอดีออกจากสต็อกเรียบร้อยแล้ว', 'success');
      } else {
        showAdminToast(data.message || 'ไม่สามารถลบไอดีนี้ได้', 'error');
      }
    } catch (err: any) {
      showAdminToast(err.message || 'เกิดข้อผิดพลาดในการลบไอดี', 'error');
    } finally {
      setDeletingStockId(null);
    }
  };

  // Add Bulk Stock to Selected Product
  const handleBulkAddStock = async () => {
    if (!selectedProductId) {
      setStockMessage({ type: 'error', text: 'กรุณาเลือกสินค้าก่อน' });
      return;
    }
    if (!rawStockInput.trim()) {
      setStockMessage({ type: 'error', text: 'กรุณากรอกข้อมูลรหัสผ่าน (หนึ่งแถวต่อหนึ่งไอดี)' });
      return;
    }

    setIsAddingStock(true);
    setStockMessage(null);

    try {
      const res = await fetch(`/api/products/${selectedProductId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ rawText: rawStockInput }),
      });
      const data = await res.json();
      if (data.success) {
        setStockMessage({ type: 'success', text: data.message || `เพิ่มสต็อกสำเร็จ!` });
        setRawStockInput('');
        fetchProductStock(selectedProductId);
        onRefreshProducts();
        showAdminToast('เพิ่มสต็อกไอดีสำเร็จ!', 'success');
      } else {
        setStockMessage({ type: 'error', text: data.message || 'เกิดข้อผิดพลาดในการเพิ่มสต็อก' });
        showAdminToast(data.message || 'เกิดข้อผิดพลาดในการเพิ่มสต็อก', 'error');
      }
    } catch (err: any) {
      setStockMessage({ type: 'error', text: err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ' });
      showAdminToast(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ', 'error');
    } finally {
      setIsAddingStock(false);
    }
  };

  // Delete Product
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin },
      });
      const data = await res.json();
      if (data.success) {
        onRefreshProducts();
        if (selectedProductId === productToDelete.id) {
          const remaining = products.filter(p => p.id !== productToDelete.id);
          setSelectedProductId(remaining[0]?.id || '');
        }
        setProductToDelete(null);
        showAdminToast('ลบสินค้าและสต็อกเรียบร้อยแล้ว', 'success');
      } else {
        showAdminToast(data.message || 'ลบสินค้าไม่สำเร็จ', 'error');
      }
    } catch (err: any) {
      showAdminToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Save Edited Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshProducts();
        setEditingProduct(null);
        showAdminToast('บันทึกการแก้ไขสินค้าสำเร็จ!', 'success');
      } else {
        showAdminToast(data.message || 'บันทึกไม่สำเร็จ', 'error');
      }
    } catch (err: any) {
      showAdminToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  // Approve Pending Transaction
  const handleApproveTransaction = async (txId: string) => {
    setApprovingTxId(txId);
    try {
      const manualAmt = manualApprovalAmount[txId];
      const res = await fetch(`/api/admin/transactions/${txId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ manualAmount: manualAmt }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTransactions();
        showAdminToast('อนุมัติการเติมเงินและเพิ่มเครดิตสำเร็จ!', 'success');
      } else {
        showAdminToast(data.message || 'อนุมัติไม่สำเร็จ', 'error');
      }
    } catch (err: any) {
      showAdminToast(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ', 'error');
    } finally {
      setApprovingTxId(null);
    }
  };

  // Reject Transaction
  const handleRejectTransaction = async (txId: string, customReason?: string) => {
    const reason = customReason || 'สลิปไม่ถูกต้อง หรือยอดเงินไม่ตรง';
    setRejectingTxId(txId);
    try {
      const res = await fetch(`/api/admin/transactions/${txId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTransactions();
        showAdminToast('ปฏิเสธรายการสลิปเรียบร้อยแล้ว', 'success');
      } else {
        showAdminToast(data.message || 'ปฏิเสธไม่สำเร็จ', 'error');
      }
    } catch (err: any) {
      showAdminToast(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ', 'error');
    } finally {
      setRejectingTxId(null);
    }
  };

  // Save Store Config
  const handleSaveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigMessage(null);
    try {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
      const ok = await onUpdateConfig({
        bankAccount,
        bankAccountName,
        truemoneyPhone,
        slipokApiKey,
        slipokApiUrl,
        supabaseUrl,
        supabaseAnonKey,
        newAdminPin: newAdminPin.trim() || undefined,
      });
      if (ok) {
        setConfigMessage('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!');
        setNewAdminPin('');
        setTimeout(() => setConfigMessage(null), 3500);
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyCredentials = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStockId(id);
    setTimeout(() => setCopiedStockId(null), 2000);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    setSyncSupabaseMessage(null);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseTestResult(data);
    } catch (err: any) {
      setSupabaseTestResult({
        connected: false,
        allTablesExist: false,
        message: err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ',
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSyncAllToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncSupabaseMessage(null);
    try {
      const res = await fetch('/api/supabase/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSyncSupabaseMessage({ type: 'success', text: data.message });
      } else {
        setSyncSupabaseMessage({ type: 'error', text: data.message });
      }
      handleTestSupabase();
    } catch (err: any) {
      setSyncSupabaseMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleCopyCallbackUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedCallbackUrl(true);
    setTimeout(() => setCopiedCallbackUrl(false), 2000);
  };

  const currentSelectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#140b28] via-[#0d071b] to-[#07030e] border border-purple-500/30 shadow-[0_0_80px_rgba(147,51,234,0.3)] p-5 sm:p-7 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* In-Modal Admin Toast Alert */}
        {adminToast && (
          <div className={`mb-5 p-3 rounded-2xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
            adminToast.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
          }`}>
            {adminToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="font-medium flex-1">{adminToast.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">ระบบจัดการร้านค้าและสต็อกไอดี</h2>
              <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-500/40 font-bold uppercase tracking-wider">
                ANGUS ENTERPRISE
              </span>
            </div>
            <p className="text-xs text-purple-200/70 mt-0.5">
              เพิ่มไอดีแบบด่วน, ลบไอดีในสต็อก, จัดการสินค้า, ตรวจสอบสลิป SlipOK และตั้งค่าฐานข้อมูล
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 p-1.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-xs">
          <button
            onClick={() => setActiveTab('quick-add')}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'quick-add'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>เพิ่มไอดีด่วน</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-300" />
            <span>สต็อกไอดี & ลบ</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 text-purple-300" />
            <span>สินค้า ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>สลิป & การเงิน</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-300" />
            <span>ตั้งค่าระบบ</span>
          </button>
        </div>

        {/* TAB 1: QUICK ADD (EASY 1-STEP ADD ID) */}
        {activeTab === 'quick-add' && (
          <form onSubmit={handleQuickAdd} className="space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 via-[#180d32] to-[#120726] border border-purple-500/30 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  เพิ่มไอดีลงขายแบบด่วน (Fast 1-Step Add)
                </h3>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  เลือกเกมที่ต้องการ ใส่ชื่อไอดี ราคา และข้อมูลรหัสผ่าน แล้วกดยืนยัน ระบบจะสร้างสินค้าพร้อมนำเข้ารหัสเข้าสต็อกพร้อมขายทันที!
                </p>
              </div>

              {/* Game Presets Picker */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-2">
                  1. เลือกหมวดหมู่เกม / แม่แบบสำเร็จรูป
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GAME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        selectedPresetId === preset.id
                          ? 'bg-purple-600/40 border-purple-400 text-white shadow-md'
                          : 'bg-purple-950/30 border-purple-500/20 text-purple-300 hover:border-purple-400/50 hover:bg-purple-900/30'
                      }`}
                    >
                      <span className="text-xs font-bold block truncate">{preset.name.split(' (')[0]}</span>
                      <span className="text-[10px] text-purple-300/70 block mt-0.5 font-mono">฿{preset.price} • {preset.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    2. ชื่อสินค้า / ชื่อไอดี (Account Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="เช่น ไก่ตันหมัดก็อด + ดาบคู่ CDK เลเวลตัน"
                    className="w-full bg-[#160c2b] border border-purple-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    3. ราคาขาย (บาท THB)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(Number(e.target.value))}
                    className="w-full bg-[#160c2b] border border-purple-500/30 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Direct Stock Credentials Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-purple-200">
                    4. รหัสผ่าน / ข้อมูลไอดี (วางไอดีที่นี่ได้ทันที 1 บรรทัด = 1 ไอดี)
                  </label>
                  <span className="text-[11px] text-purple-300/60">
                    {quickCredentials.trim() ? `${quickCredentials.trim().split('\n').filter(Boolean).length} ไอดีพร้อมลงขาย` : 'ยังไม่มีรหัส'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder={`User: RobloxPlayer01 | Pass: StrongPass999! | รายละเอียด: ไม่ติดเมล\nUser: RobloxPlayer02 | Pass: StrongPass888! | รายละเอียด: ไม่ติดเมล`}
                  value={quickCredentials}
                  onChange={(e) => setQuickCredentials(e.target.value)}
                  className="w-full bg-[#110724] border border-purple-500/40 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-purple-400 shadow-inner"
                />
                <p className="text-[11px] text-purple-300/60 mt-1">
                  💡 ลูกค้าที่กดซื้อในหน้าเว็บจะได้รับข้อความรหัสในบรรทัดด้านบนนี้ทันที 1 ไอดีต่อ 1 ออเดอร์
                </p>
              </div>

              {/* Feedback Message */}
              {quickMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    quickMessage.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/60 border border-rose-500/60 text-rose-200'
                  }`}
                >
                  {quickMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{quickMessage.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isQuickAdding}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>{isQuickAdding ? 'กำลังบันทึกและลงขาย...' : '🚀 บันทึกสินค้าและเปิดขายทันที'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: INVENTORY & STOCK ID DELETION (CRITICAL FIX) */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            {/* Product Selector */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  เลือกสินค้าที่ต้องการดูสต็อกและลบไอดี:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full sm:w-80 bg-[#160c2b] border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (คงเหลือ: {p.stockCount} ไอดี)
                    </option>
                  ))}
                </select>
              </div>

              {currentSelectedProduct && (
                <div className="flex items-center gap-3">
                  <img
                    src={currentSelectedProduct.image}
                    alt={currentSelectedProduct.name}
                    className="w-12 h-12 rounded-xl object-cover border border-purple-500/40"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{currentSelectedProduct.name}</span>
                    <span className="text-xs text-purple-300 font-mono">
                      ฿{currentSelectedProduct.price} • สต็อกจริง: <strong className="text-emerald-400">{currentSelectedProduct.stockCount} ชิ้น</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* List of accounts in stock */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  รายการไอดีในสต็อกของสินค้านี้ ({stockList.length} รายการ)
                </h4>
                <button
                  onClick={() => fetchProductStock(selectedProductId)}
                  className="text-xs text-purple-300 hover:text-white flex items-center gap-1 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStock ? 'animate-spin' : ''}`} />
                  <span>รีเฟรช</span>
                </button>
              </div>

              {isLoadingStock ? (
                <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-purple-500/20 text-purple-300 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังโหลดรายการสต็อก...</span>
                </div>
              ) : stockList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-purple-500/20 text-purple-300/70 text-xs space-y-1">
                  <AlertCircle className="w-6 h-6 mx-auto text-purple-400" />
                  <p className="font-semibold text-white">ยังไม่มีไอดีในสต็อกสำหรับสินค้านี้</p>
                  <p className="text-[11px]">ใช้แบบฟอร์มด้านล่างเพื่อเติมรหัสผ่านเข้าสต็อกได้ทันที</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {stockList.map((item, index) => {
                    const isRevealed = revealedIds[item.id];
                    const isDeleting = deletingStockId === item.id;
                    const isCopied = copiedStockId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                          item.isUsed
                            ? 'bg-slate-950/60 border-slate-800 text-slate-500'
                            : 'bg-[#180d32]/80 border-purple-500/30 text-purple-200 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-purple-900/60 text-purple-300 font-bold font-mono text-[11px] flex items-center justify-center flex-shrink-0">
                            #{index + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-white break-all">
                                {isRevealed ? item.credentials : '••••••••••••••••••••••••••••••••'}
                              </span>
                            </div>
                            <span className="text-[10px] text-purple-300/60 block mt-0.5">
                              {item.isUsed ? '❌ ขายแล้ว (จัดส่งแล้ว)' : '✅ พร้อมขายในระบบ'} • เพิ่มเมื่อ: {new Date(item.addedAt).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        </div>

                        {/* Actions for this ID */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Reveal/Hide */}
                          <button
                            type="button"
                            onClick={() => setRevealedIds(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-300 transition cursor-pointer"
                            title={isRevealed ? 'ซ่อนรหัส' : 'ดูรหัสผ่าน'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {/* Copy */}
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(item.id, item.credentials)}
                            className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-300 transition cursor-pointer"
                            title="คัดลอกรหัสผ่าน"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* DELETE THIS STOCK ITEM BUTTON (KEY FIX) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStockItem(item.id)}
                            disabled={isDeleting}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold transition cursor-pointer flex items-center gap-1 text-[11px]"
                            title="ลบไอดีนี้ออกจากสต็อก"
                          >
                            {isDeleting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span>ลบไอดีนี้</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Bulk replenishment for this product */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                เติมรหัสผ่านเพิ่มให้สินค้านี้ (Bulk Replenish)
              </h4>
              <textarea
                rows={3}
                placeholder={`User: MyAccount01 | Pass: Pass1234!\nUser: MyAccount02 | Pass: Pass5678!`}
                value={rawStockInput}
                onChange={(e) => setRawStockInput(e.target.value)}
                className="w-full bg-[#110724] border border-purple-500/40 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-purple-400"
              />

              {stockMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    stockMessage.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/60 border border-rose-500/60 text-rose-200'
                  }`}
                >
                  {stockMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{stockMessage.text}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleBulkAddStock}
                disabled={isAddingStock || !rawStockInput.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isAddingStock ? 'กำลังนำเข้า...' : 'นำเข้ารหัสเข้าสู่สต็อกทันที'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-purple-950/30 p-3.5 rounded-2xl border border-purple-500/20">
              <div>
                <h3 className="text-sm font-bold text-white">รายการสินค้าจริงของร้าน</h3>
                <p className="text-xs text-purple-300/70">
                  มีสินค้าทั้งหมด {products.length} รายการ (สามารถแก้ไขรายละเอียด หรือลบสินค้าได้ที่นี่)
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingProduct({
                    name: '',
                    category: 'godhuman',
                    categoryLabel: 'หมัดก็อด + CDK',
                    price: 150,
                    description: '',
                    details: ['เลเวลตัน 2550', 'หมัดก็อดฮิวแมน', 'ไอดีสะอาด 100%'],
                    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
                    badge: 'ใหม่ 🔥',
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มสินค้าแบบกำหนดเอง</span>
              </button>
            </div>

            {/* Product editor form */}
            {editingProduct && (
              <form
                onSubmit={handleSaveProduct}
                className="p-5 rounded-2xl bg-[#180d32] border border-purple-500/40 space-y-3.5 shadow-2xl"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-purple-200 uppercase">
                    {editingProduct.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                  </h4>
                  <button type="button" onClick={() => setEditingProduct(null)} className="text-purple-300 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-purple-200 mb-1">ชื่อสินค้า (Product Name)</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-purple-200 mb-1">ราคาขาย (บาท THB)</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-purple-200 mb-1">หมวดหมู่สินค้า</label>
                    <input
                      type="text"
                      value={editingProduct.categoryLabel || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, categoryLabel: e.target.value })}
                      placeholder="เช่น หมัดก็อด + CDK หรือ ไอดี Valorant"
                      className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-purple-200 mb-1">ป้ายกำกับ (Badge)</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      placeholder="เช่น แนะนำ 🔥, V4 เต็ม ⚡"
                      className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-purple-200 mb-1">URL รูปภาพ</label>
                  <input
                    type="text"
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-950/60 text-purple-300 text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer shadow-md"
                  >
                    บันทึกสินค้า
                  </button>
                </div>
              </form>
            )}

            {/* Product list */}
            {products.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-purple-500/20 text-purple-300 space-y-2">
                <Package className="w-10 h-10 mx-auto text-purple-400" />
                <p className="font-semibold text-white">ยังไม่มีสินค้าในระบบ</p>
                <p className="text-xs text-purple-300/70">
                  ไปที่แท็บ "เพิ่มไอดีด่วน" ด้านบน เพื่อสร้างไอดีแรกของร้าน
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-[#180d32]/90 border border-purple-500/30 flex items-center justify-between text-xs hover:border-purple-400/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-purple-500/40" />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-sm">{p.name}</p>
                        <p className="text-purple-300/70 text-xs mt-0.5">
                          ฿{p.price} • สต็อกคงเหลือ: <span className="font-bold text-emerald-400">{p.stockCount} ชิ้น</span> • {p.categoryLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setActiveTab('inventory');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-medium transition cursor-pointer flex items-center gap-1"
                        title="ดูและจัดการไอดีในสต็อก"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-300" />
                        <span>จัดการไอดี ({p.stockCount})</span>
                      </button>

                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 transition cursor-pointer"
                        title="แก้ไขสินค้า"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setProductToDelete(p)}
                        className="p-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                        title="ลบสินค้านี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FINANCIAL TRANSACTIONS & SLIP APPROVAL */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-purple-950/30 p-3.5 rounded-2xl border border-purple-500/20">
              <div>
                <h3 className="text-sm font-bold text-white">รายการธุรกรรมเติมเงิน & สลิปทั้งหมด</h3>
                <p className="text-xs text-purple-300/70">
                  สลิปที่ผ่าน SlipOK อัตโนมัติ หรือสลิปที่รอการอนุมัติตรวจสอบจากแอดมิน
                </p>
              </div>
              <button
                onClick={fetchTransactions}
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTx ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>

            {isLoadingTx ? (
              <div className="p-8 text-center text-purple-300 text-xs">กำลังโหลดรายการธุรกรรม...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-purple-500/20 text-purple-300/70 text-xs">
                ยังไม่มีรายการเติมเงินในระบบ
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-[#180d32] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${tx.method === 'slipok_kbank' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                        {tx.method === 'slipok_kbank' ? <QrCode className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">฿{tx.amount.toLocaleString()}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            tx.status === 'success'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {tx.status === 'success' ? 'สำเร็จ' : tx.status === 'pending' ? 'รอแอดมินอนุมัติ' : 'ล้มเหลว'}
                          </span>
                        </div>
                        <p className="text-purple-300/70 text-[11px] mt-0.5">
                          ผู้โอน: {tx.senderName || tx.userEmail} • บัญชีรับ: {tx.receivingAcc || 'ร้าน'} • {new Date(tx.createdAt).toLocaleString('th-TH')}
                        </p>
                        {tx.transRef && (
                          <span className="text-[10px] text-purple-400/80 font-mono block">Ref: {tx.transRef}</span>
                        )}
                      </div>
                    </div>

                    {/* Pending Slip Action Buttons */}
                    {tx.status === 'pending' && (
                      <div className="flex items-center gap-2 sm:self-center">
                        <input
                          type="number"
                          placeholder="ยอดจริง (บาท)"
                          value={manualApprovalAmount[tx.id] || tx.amount || ''}
                          onChange={(e) => setManualApprovalAmount({ ...manualApprovalAmount, [tx.id]: e.target.value })}
                          className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                        />
                        <button
                          onClick={() => handleApproveTransaction(tx.id)}
                          disabled={approvingTxId === tx.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                        >
                          {approvingTxId === tx.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>อนุมัติ</span>
                        </button>
                        <button
                          onClick={() => handleRejectTransaction(tx.id)}
                          disabled={rejectingTxId === tx.id}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs cursor-pointer transition disabled:opacity-50"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SYSTEM & STORE SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveStoreConfig} className="space-y-5">
            {/* Supabase Database & Accounts Manager Box */}
            <div className="p-4 rounded-2xl bg-[#180d32] border border-purple-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="font-bold text-white text-sm">ฐานข้อมูล Supabase & สมาชิก (anguskaituntheshop)</span>
                    <p className="text-[11px] text-purple-300/70">ตรวจสอบและซิงค์ข้อมูลบัญชีผู้ใช้ สินค้า และสต็อก</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/60 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>ตรวจสอบสถานะ</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncAllToSupabase}
                    disabled={isSyncingSupabase}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isSyncingSupabase ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเข้า Supabase'}</span>
                  </button>
                </div>
              </div>

              {/* Status or Diagnostic Result */}
              {supabaseTestResult && (
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      supabaseTestResult.allTablesExist
                        ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-200'
                        : 'bg-amber-950/60 border border-amber-500/60 text-amber-200'
                    }`}
                  >
                    {supabaseTestResult.allTablesExist ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">{supabaseTestResult.message}</p>
                      {supabaseTestResult.tables && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 text-[10px]">
                          {Object.entries(supabaseTestResult.tables).map(([tbl, ok]) => (
                            <div
                              key={tbl}
                              className={`p-1.5 rounded-lg border text-center font-mono ${
                                ok 
                                  ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300' 
                                  : 'bg-rose-900/40 border-rose-500/50 text-rose-300 font-bold'
                              }`}
                            >
                              {ok ? '✓ ' : '✗ '}ตาราง {tbl}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {syncSupabaseMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    syncSupabaseMessage.type === 'success'
                      ? 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/70 border border-rose-500/60 text-rose-200'
                  }`}
                >
                  {syncSupabaseMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{syncSupabaseMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-purple-200 mb-1">Supabase Project URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-200 mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOi..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* SQL Schema Copy & Instructions */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/20 space-y-2.5 text-xs text-purple-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-purple-400" />
                    <span>วิธีทำให้บัญชีและสินค้าขึ้นใน Supabase Table Editor 100%:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySchema}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedSchema ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL Schema (1 คลิก)'}</span>
                    </button>
                    <a
                      href="https://supabase.com/dashboard/project/bqysxqbnkyksehcyhkad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition no-underline"
                    >
                      <span>เปิด Supabase</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-purple-300/80 pl-1 leading-relaxed">
                  <li>กดปุ่ม <strong>"คัดลอก SQL Schema"</strong> ด้านบน</li>
                  <li>เปิด <strong>Supabase Dashboard</strong> แล้วไปที่เมนู <strong>SQL Editor</strong> ด้านซ้าย</li>
                  <li>กด <strong>New query</strong> วางโค้ดลงไป แล้วกดปุ่ม <strong>RUN</strong> สีเขียว</li>
                  <li>เมื่อตารางถูกสร้างเสร็จ ให้กลับมากดปุ่ม <strong>"ซิงค์ข้อมูลเข้า Supabase"</strong> ด้านบน บัญชีผู้ใช้ สินค้า สต็อก จะขึ้นครบ 100%!</li>
                </ol>
              </div>

              {/* Google OAuth Configuration Guide */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs text-purple-200">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>การตั้งค่า Google OAuth ใน Supabase (แก้ล็อกอิน Google):</span>
                </span>
                <p className="text-[11px] text-purple-300/80 leading-relaxed">
                  1. ใน Supabase ไปที่ <strong>Authentication &gt; Providers &gt; Google</strong> แล้วเปิดใช้งาน (Enable Google)<br />
                  2. กรอก <strong>Client ID</strong> และ <strong>Client Secret</strong> จาก Google Cloud Console<br />
                  3. นำ Callback URL นี้ไปใส่ใน Google Cloud Credentials (Authorized redirect URIs):
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://bqysxqbnkyksehcyhkad.supabase.co/auth/v1/callback"
                    className="flex-1 bg-[#110724] border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-[11px] text-purple-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyCallbackUrl('https://bqysxqbnkyksehcyhkad.supabase.co/auth/v1/callback')}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600/60 hover:bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    {copiedCallbackUrl ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment & Security Box */}
            <div className="p-4 rounded-2xl bg-[#180d32] border border-purple-500/30 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                บัญชีธนาคาร, SlipOK และ TrueMoney
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-purple-200 mb-1">เลขบัญชีกสิกรไทย (KBANK)</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-200 mb-1">ชื่อบัญชีกสิกรไทย</label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-200 mb-1">เบอร์ TrueMoney Wallet ของร้าน</label>
                  <input
                    type="text"
                    value={truemoneyPhone}
                    onChange={(e) => setTruemoneyPhone(e.target.value)}
                    className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-200 mb-1">SlipOK API Key</label>
                  <input
                    type="text"
                    value={slipokApiKey}
                    onChange={(e) => setSlipokApiKey(e.target.value)}
                    className="w-full bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Security PIN Change */}
            <div className="p-4 rounded-2xl bg-[#180d32] border border-purple-500/30 space-y-2">
              <label className="block text-xs font-bold text-white">
                เปลี่ยนรหัส Admin PIN ความปลอดภัย (ปัจจุบันคือ 190850)
              </label>
              <input
                type="password"
                placeholder="ปล่อยว่างหากไม่ต้องการเปลี่ยน (อย่างน้อย 4 ตัวอักษร)"
                value={newAdminPin}
                onChange={(e) => setNewAdminPin(e.target.value)}
                className="w-full sm:w-80 bg-[#110724] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>

            {configMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{configMessage}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
              </button>
            </div>
          </form>
        )}

        {/* MODAL: DELETE PRODUCT CONFIRMATION (REPLACES FLAKY WINDOW.CONFIRM) */}
        {productToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl bg-[#1a0f35] border border-rose-500/50 p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">ยืนยันการลบสินค้า</h3>
              </div>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า <strong className="text-white">"{productToDelete.name}"</strong>? 
                การกระทำนี้จะลบรายการสินค้าและรหัสในสต็อกที่เกี่ยวข้องทั้งหมดออกจากระบบทันที
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeletingProduct}
                  className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteProduct}
                  disabled={isDeletingProduct}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isDeletingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>ยืนยันลบสินค้านี้</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
