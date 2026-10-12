export interface Product {
  id: string;
  name: string;
  category: 'godhuman' | 'v4' | 'mythical' | 'cdk' | 'random' | 'budget';
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  description: string;
  details: string[];
  image: string;
  badge?: string;
  featured?: boolean;
  stockCount: number;
  createdAt: string;
}

export interface StockAccount {
  id: string;
  productId: string;
  credentials: string; // e.g. "Username:Password" or "User | Pass | Info"
  addedAt: string;
  isUsed: boolean;
  orderId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  balance: number;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface PurchasedAccountItem {
  productId: string;
  productName: string;
  credentials: string;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: PurchasedAccountItem[];
  totalAmount: number;
  discountAmount: number;
  couponCode?: string;
  createdAt: string;
  status: 'completed' | 'refunded';
}

export interface TopupTransaction {
  id: string;
  userId: string;
  userEmail: string;
  method: 'slipok_kbank' | 'truemoney_voucher';
  amount: number;
  transRef?: string;
  senderName?: string;
  senderBank?: string;
  receivingAcc?: string;
  status: 'success' | 'failed' | 'pending';
  slipImage?: string;
  voucherHash?: string;
  createdAt: string;
  rawResponse?: any;
}

export interface StoreConfig {
  storeName: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  truemoneyPhone: string;
  slipokApiKey: string;
  slipokApiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  adminPin?: string;
  announcement: string;
  discordUrl?: string;
  facebookUrl?: string;
}
