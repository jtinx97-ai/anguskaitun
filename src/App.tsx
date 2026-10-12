import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Swords, 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  ShoppingBag, 
  Wallet, 
  Package, 
  CheckCircle2, 
  ChevronRight, 
  Database,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  ArrowUpDown,
  Plus,
  Building2
} from 'lucide-react';

import { Product, CartItem, User, Order, TopupTransaction, StoreConfig } from './types';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { TopupModal } from './components/TopupModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminModal } from './components/AdminModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AuthModal } from './components/AuthModal';
import { getSupabaseClient } from './lib/supabase';

// Audio feedback helper
const playChime = (type: 'success' | 'click' | 'purchase') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'purchase' || type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    // Audio context not allowed or not supported
  }
};

export default function App() {
  // App States
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<TopupTransaction[]>([]);
  
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    storeName: 'AngusShopX',
    bankName: 'ธนาคารกสิกรไทย (KBANK)',
    bankAccount: '1668303060',
    bankAccountName: 'กฤตินสุโขพล',
    truemoneyPhone: '0829848852',
    slipokApiKey: 'SLIPOKMU0I0O9',
    slipokApiUrl: 'https://api.slipok.com/api/line/apikey/77989',
    supabaseUrl: 'https://anguskaituntheshop.supabase.co',
    supabaseAnonKey: '',
    announcement: 'ยินดีต้อนรับสู่ AngusShopX ร้านขายรหัสไก่ตัน Blox Fruits อัตโนมัติ 24 ชม.',
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem('angus_admin_pin') || '' : ''));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  const handleOpenAdmin = () => {
    if (adminPin) {
      setIsAdminOpen(true);
    } else {
      setIsAdminPinModalOpen(true);
    }
  };

  // Secret admin access (Ctrl+Shift+A, Alt+A, or ?admin URL query)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        handleOpenAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (window.location.search.includes('admin') || window.location.hash === '#admin') {
      handleOpenAdmin();
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminPin]);

  const [secretClicks, setSecretClicks] = useState(0);
  const handleSecretClick = () => {
    setSecretClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        handleOpenAdmin();
        return 0;
      }
      return next;
    });
    setTimeout(() => setSecretClicks(0), 3000);
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch initial data
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchOrders = async (userId?: string) => {
    try {
      const url = userId ? `/api/orders?userId=${userId}` : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchTransactions = async (userId?: string) => {
    try {
      const url = userId ? `/api/transactions?userId=${userId}` : '/api/transactions';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const fetchStoreConfig = async () => {
    try {
      const res = await fetch('/api/store/config');
      const data = await res.json();
      if (data.success && data.data) {
        setStoreConfig(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  // Auto-login default user or load saved user
  useEffect(() => {
    fetchProducts();
    fetchStoreConfig();

    // Supabase auth state listener
    const supabaseClient = getSupabaseClient();
    const { data: authSub } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const uEmail = session.user.email || 'customer@angusshopx.com';
        const uName = session.user.user_metadata?.name || session.user.user_metadata?.full_name || uEmail.split('@')[0];
        try {
          const res = await fetch('/api/user/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: session.user.id || `usr-${uEmail.replace(/[@.]/g, '_')}`,
              email: uEmail,
              name: uName,
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${uEmail}`,
            }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('angus_active_user', JSON.stringify(data.user));
            if (data.user.role === 'admin' || data.user.email === 'jtinx97@gmail.com') {
              setAdminPin('190850');
              sessionStorage.setItem('angus_admin_pin', '190850');
            }
            fetchOrders(data.user.id);
            fetchTransactions(data.user.id);
            setIsAuthOpen(false);
            showToast(`ยินดีต้อนรับ ${data.user.name}!`);
          }
        } catch (e) {}
      }
    });

    // Listen for OAuth Popup PostMessage
    const handleAuthMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'SUPABASE_GOOGLE_AUTH_SUCCESS') {
        const { hash, search } = e.data;
        try {
          if (hash) {
            const params = new URLSearchParams(hash.replace(/^#/, ''));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabaseClient.auth.setSession({ access_token, refresh_token });
            }
          } else if (search) {
            const params = new URLSearchParams(search.replace(/^\?/, ''));
            const code = params.get('code');
            if (code) {
              await supabaseClient.auth.exchangeCodeForSession(code);
            }
          }
        } catch (err) {
          console.error('Error exchanging session:', err);
        }
      }
    };
    window.addEventListener('message', handleAuthMessage);

    // Check if URL directly contains OAuth tokens or callback
    if (typeof window !== 'undefined') {
      const isCallbackPath = window.location.pathname === '/auth/callback';
      const hasTokenHash = window.location.hash && window.location.hash.includes('access_token=');
      
      if (window.opener && window.opener !== window && (hasTokenHash || isCallbackPath)) {
        try {
          window.opener.postMessage({ 
            type: 'SUPABASE_GOOGLE_AUTH_SUCCESS', 
            hash: window.location.hash,
            search: window.location.search 
          }, '*');
          setTimeout(() => window.close(), 350);
          return;
        } catch (e) {
          console.warn('postMessage to opener error:', e);
        }
      }

      if (hasTokenHash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken) {
          supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || accessToken })
            .then(() => {
              window.history.replaceState(null, '', window.location.pathname);
            })
            .catch(console.error);
        }
      }
    }

    const savedUserJson = localStorage.getItem('angus_active_user');
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        if (parsed) {
          setUser(parsed);
          if (parsed.role === 'admin' || parsed.email === 'jtinx97@gmail.com') {
            setAdminPin('190850');
            sessionStorage.setItem('angus_admin_pin', '190850');
          }
          fetchOrders(parsed.id);
          fetchTransactions(parsed.id);
        }
      } catch (e) {
        localStorage.removeItem('angus_active_user');
        setUser(null);
      }
    } else {
      // First visit: NO auto-login! Keep user as null (Visitor)
      setUser(null);
    }

    return () => {
      authSub?.subscription?.unsubscribe();
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('angus_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('angus_active_user');
    }
  }, [user]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stockCount <= 0) {
      showToast('สินค้านี้หมดชั่วคราว');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockCount) {
          showToast(`สินค้ามีในสต็อกเพียง ${product.stockCount} ชิ้น`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });

    playChime('click');
    showToast(`เพิ่ม "${product.name}" ลงในตะกร้าแล้ว`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Immediate Buy Now
  const handleBuyNow = (product: Product) => {
    if (product.stockCount <= 0) {
      showToast('สินค้านี้หมดชั่วคราว');
      return;
    }
    setCart([{ product, quantity: 1 }]);
    setIsCartOpen(true);
  };

  // Checkout Execution
  const handleCheckout = async (couponCode?: string): Promise<boolean> => {
    if (!user) {
      setIsAuthOpen(true);
      return false;
    }

    try {
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          items: itemsPayload,
          couponCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        playChime('purchase');
        setUser(prev => prev ? { ...prev, balance: data.newBalance } : null);
        setCart([]);
        setLatestOrder(data.order);
        fetchProducts(); // Refresh stock counts
        fetchOrders(user.id);
        return true;
      } else {
        showToast(data.message || 'การสั่งซื้อไม่สำเร็จ');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      return false;
    }
  };

  // Top-up Success Handler
  const handleTopupSuccess = (amount: number, newBalance: number) => {
    playChime('success');
    setUser(prev => prev ? { ...prev, balance: newBalance } : null);
    if (user) {
      fetchTransactions(user.id);
    }
    showToast(`เติมเงินสำเร็จ ฿${amount.toLocaleString()} ยอดเงินอัปเดตแล้ว!`);
  };

  // Filter & Sort Products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      selectedCategory === 'all' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'godhuman', label: 'หมัดก็อดฮิวแมน (Godhuman)' },
    { id: 'mythical', label: 'ผลปีศาจตื่น (Kitsune/Mochi)' },
    { id: 'cdk', label: 'ดาบคู่ CDK & ไอเทมเทพ' },
    { id: 'v4', label: 'เผ่า V4 ขั้นเต็ม Full Gear' },
    { id: 'budget', label: 'RoV & Valorant' },
    { id: 'random', label: 'Roblox & สุ่มไอดี' },
  ];

  return (
    <div className="min-h-screen bg-[#080412] text-slate-100 flex flex-col font-['Kanit',sans-serif] selection:bg-purple-600 selection:text-white">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(147,51,234,0.5)] flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        user={user}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTopup={() => setIsTopupOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          setUser(null);
          setAdminPin('');
          sessionStorage.removeItem('angus_admin_pin');
          localStorage.removeItem('angus_active_user');
          showToast('ออกจากระบบเรียบร้อย');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroBanner
          onOpenTopup={() => setIsTopupOpen(true)}
          onExploreProducts={() => {
            const el = document.getElementById('catalog-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Catalog Section */}
        <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Swords className="w-4 h-4" />
                <span>คลังไอดีพร้อมส่งทันที • ANGUS ENTERPRISE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                เลือกซื้อไอดีคุณภาพพรีเมียม
              </h2>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-purple-400" />
                <input
                  type="text"
                  placeholder="ค้นหาไอดี (เช่น หมัดก็อด, CDK, Kitsune)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#150b28]/90 border border-purple-500/30 focus:border-purple-400 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-300/40 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Sort selector */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#150b28]/90 border border-purple-500/30 focus:border-purple-400 rounded-2xl px-3 py-2 text-xs text-purple-200 focus:outline-none cursor-pointer"
                >
                  <option value="featured">แนะนำยอดนิยม</option>
                  <option value="price-asc">ราคา: ต่ำไปสูง</option>
                  <option value="price-desc">ราคา: สูงไปต่ำ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                    : 'bg-[#150b28]/80 border border-purple-500/20 text-purple-300/70 hover:text-white hover:border-purple-500/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="py-16 px-6 text-center rounded-3xl bg-gradient-to-b from-[#160c2d] to-[#0a0515] border border-purple-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-300 mx-auto flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                ขณะนี้สินค้ากำลังทยอยเติมสต็อกเข้าสู่ระบบ
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/70 max-w-md mx-auto leading-relaxed">
                ทางบริษัทกำลังเตรียมลงไอดีชุดใหม่ คุณภาพพรีเมียม ปลอดภัย 100% สามารถเติมเงินล่วงหน้าเพื่อเตรียมช้อปได้ทันที
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {user?.role === 'admin' && (
                  <button
                    onClick={handleOpenAdmin}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 cursor-pointer transition transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>จัดการสต็อกสินค้า</span>
                  </button>
                )}
                <button
                  onClick={() => setIsTopupOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer transition transform active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  <span>เติมเงินเข้าบัญชี (KBank / TrueMoney)</span>
                </button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-[#140b28]/40 border border-purple-500/20">
              <Swords className="w-12 h-12 text-purple-500/40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-purple-200">ไม่พบไอดีที่ตรงกับการค้นหา</h3>
              <p className="text-xs text-purple-300/60 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 px-4 py-2 rounded-2xl bg-purple-950 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-900 transition cursor-pointer"
              >
                รีเซ็ตตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onViewDetails={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Corporate Trust Pillars section */}
        <section className="bg-gradient-to-b from-[#100722] to-[#080412] border-t border-purple-500/20 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">ENTERPRISE STANDARDS</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                มาตรฐานการบริการระดับบริษัทมืออาชีพ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-[#150b2b] border border-purple-500/30 space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">ไอดีสะอาด ปลอดภัย 100%</h4>
                <p className="text-xs text-purple-200/70 leading-relaxed">
                  ทุกไอดีไม่เคยผ่านการผูกอีเมล ไม่ติดเบอร์โทรศัพท์ ลูกค้าสามารถนำไปผูกข้อมูลส่วนตัวและเปลี่ยนรหัสผ่านได้ทันที พร้อมรับประกันความปลอดภัย
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#150b2b] border border-purple-500/30 space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Flame className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">ระบบตรวจสอบสลิป SlipOK แม่นยำ</h4>
                <p className="text-xs text-purple-200/70 leading-relaxed">
                  โอนเข้าบัญชีกสิกรไทย 166-8-30306-0 นายกฤติน สุโขพล สลิปตรวจสอบทันทีด้วย API SlipOK อัตโนมัติ เครดิตเข้ากระเป๋าใน 3 วินาที
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#150b2b] border border-purple-500/30 space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Wallet className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">TrueMoney Wallet 082-984-8852</h4>
                <p className="text-xs text-purple-200/70 leading-relaxed">
                  เติมผ่านซองของขวัญทรูมันนี่วอลเล็ทได้จริง ระบบดึงยอดเข้าเบอร์ร้านอัตโนมัติ ไม่ต้องรอนาน ปลอดภัยและรวดเร็วตลอด 24 ชั่วโมง
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-[#090414] border-t border-purple-500/20 py-12 text-xs text-purple-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-purple-400" />
              <div>
                <span className="text-base font-black text-white">ANGUS ENTERPRISE CO., LTD.</span>
                <span className="text-purple-400/80 block text-[11px]">บริษัท แองกัส ดิจิทัล เอ็นเตอร์ไพรส์ จำกัด • DBD Registered</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-emerald-400">กสิกรไทย: 166-8-30306-0 (กฤตินสุโขพล)</span>
              <span>•</span>
              <span className="text-amber-400">TrueWallet: 082-984-8852</span>
            </div>
          </div>

          <div className="pt-4 border-t border-purple-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-purple-300/50">
            <p onClick={handleSecretClick} className="cursor-default select-none hover:text-purple-300 transition" title="AngusEnterprise">
              © {new Date().getFullYear()} Angus Enterprise Co., Ltd. All rights reserved. ระบบจัดส่งอัตโนมัติ 24 ชั่วโมง
            </p>
            <p>Blox Fruits, Valorant, RoV, Roblox เป็นเครื่องหมายการค้าของเจ้าของลิขสิทธิ์ ทางร้านจำหน่ายเพื่อความบันเทิง</p>
          </div>
        </div>
      </footer>

      {/* All Application Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        user={user}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenTopup={() => { setIsCartOpen(false); setIsTopupOpen(true); }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onCheckout={handleCheckout}
      />

      <TopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        user={user}
        onTopupSuccess={handleTopupSuccess}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        transactions={transactions}
      />

      <OrderSuccessModal
        order={latestOrder}
        onClose={() => setLatestOrder(null)}
        onViewAllOrders={() => setIsOrdersOpen(true)}
      />

      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        currentUserId={user?.id}
        onSuccess={(enteredPin, updatedUser) => {
          setAdminPin(enteredPin);
          sessionStorage.setItem('angus_admin_pin', enteredPin);
          if (updatedUser) {
            setUser(updatedUser);
          }
          setIsAdminOpen(true);
          showToast('ยืนยันรหัสความปลอดภัยสำเร็จ!');
        }}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onRefreshProducts={fetchProducts}
        config={storeConfig}
        adminPin={adminPin}
        onUpdateConfig={async (newCfg) => {
          try {
            const res = await fetch('/api/store/config', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-admin-pin': adminPin,
              },
              body: JSON.stringify(newCfg),
            });
            const data = await res.json();
            if (data.success) {
              setStoreConfig(prev => ({ ...prev, ...newCfg }));
              if (newCfg.newAdminPin) {
                setAdminPin(newCfg.newAdminPin);
                sessionStorage.setItem('angus_admin_pin', newCfg.newAdminPin);
              }
              return true;
            } else {
              showToast(data.message || 'บันทึกการตั้งค่าไม่สำเร็จ');
            }
          } catch (e) {
            console.error(e);
          }
          return false;
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser?.role === 'admin' || loggedInUser?.email === 'jtinx97@gmail.com') {
            setAdminPin('190850');
            sessionStorage.setItem('angus_admin_pin', '190850');
          }
          fetchOrders(loggedInUser.id);
          fetchTransactions(loggedInUser.id);
          showToast(`ยินดีต้อนรับ ${loggedInUser.name}!`);
        }}
      />
    </div>
  );
}
