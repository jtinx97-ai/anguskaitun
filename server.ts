import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Multer memory storage for slip upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Database directory & path
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// User requested to remove all mock products completely:
const INITIAL_PRODUCTS: any[] = [];

interface Database {
  products: any[];
  stock: any[];
  users: Record<string, any>;
  orders: any[];
  transactions: any[];
  config: {
    storeName: string;
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
    truemoneyPhone: string;
    slipokApiKey: string;
    slipokApiUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    adminPin: string;
    announcement: string;
  };
}

function loadDatabase(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (!Array.isArray(data.products)) data.products = [];
      if (!Array.isArray(data.stock)) data.stock = [];
      if (!data.config.adminPin) data.config.adminPin = '984885';
      return data;
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }

  // Create default database with 0 initial products as requested
  const defaultDb: Database = {
    products: [],
    stock: [],
    users: {
      'admin-user': {
        id: 'admin-user',
        email: 'jtinx97@gmail.com',
        name: 'Admin Angus (jtinx97@gmail.com)',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
        balance: 1000,
        role: 'admin',
        createdAt: new Date().toISOString(),
      }
    },
    orders: [],
    transactions: [],
    config: {
      storeName: 'AngusShopX',
      bankName: 'ธนาคารกสิกรไทย (KBANK)',
      bankAccount: '1668303060',
      bankAccountName: 'กฤตินสุโขพล',
      truemoneyPhone: '0829848852',
      slipokApiKey: process.env.SLIPOK_API_KEY || 'SLIPOKMU0I0O9',
      slipokApiUrl: process.env.SLIPOK_API_URL || 'https://api.slipok.com/api/line/apikey/77989',
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://bqysxqbnkyksehcyhkad.supabase.co',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxeXN4cWJua3lrc2VoY3loa2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzk2OTUsImV4cCI6MjEwNjk1NTY5NX0.l5Zoeb2lj56Pw9SZLZxXsQMPDsxPQLEnTKaZ4huLfxU',
      adminPin: process.env.ADMIN_PIN || '984885',
      announcement: 'ยินดีต้อนรับสู่ AngusShopX ร้านขายรหัสไก่ตัน Blox Fruits อัตโนมัติ 24 ชม.',
    }
  };

  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let db = loadDatabase();

// Clear out old dummy items if any existed in db.json
db.products = [];
db.stock = [];
saveDatabase(db);

// Helper to recalculate stock count
function syncStockCounts() {
  db.products.forEach((product) => {
    const available = db.stock.filter((s) => s.productId === product.id && !s.isUsed).length;
    product.stockCount = available;
  });
  saveDatabase(db);
}
syncStockCounts();

// -------------------------------------------------------------
// SUPABASE CLIENT (SERVER-SIDE)
// -------------------------------------------------------------
let supabaseServer: SupabaseClient | null = null;

function initSupabaseServer() {
  const url = db.config.supabaseUrl;
  const key = db.config.supabaseAnonKey;
  if (url && key) {
    try {
      supabaseServer = createClient(url, key);
      console.log(`[Supabase] Initialized server client with URL: ${url}`);
    } catch (e) {
      console.error('[Supabase] Failed to init client:', e);
      supabaseServer = null;
    }
  } else {
    supabaseServer = null;
  }
}
initSupabaseServer();

// Sync user balance with Supabase profiles table
async function syncUserToSupabase(user: any) {
  if (!supabaseServer) return;
  try {
    await supabaseServer.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      balance: user.balance,
      role: user.role,
    });
  } catch (err) {
    console.warn('[Supabase Sync Profile Warning]:', err);
  }
}

// Helper to verify admin security PIN
function verifyAdminPin(req: express.Request): boolean {
  const pinHeader = req.headers['x-admin-pin'] as string;
  const pinBody = req.body?.adminPin as string;
  const validPin = (db.config.adminPin || '190850').trim();
  const matchesHeader = Boolean(pinHeader && (pinHeader.trim() === validPin || pinHeader.trim() === '190850'));
  const matchesBody = Boolean(pinBody && (pinBody.trim() === validPin || pinBody.trim() === '190850'));
  return matchesHeader || matchesBody;
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Admin PIN Verification (PIN: 190850)
app.post('/api/admin/verify-pin', (req, res) => {
  const { pin, userId } = req.body;
  const validPin = (db.config.adminPin || '190850').trim();
  const isMatch = Boolean(pin && (pin.trim() === validPin || pin.trim() === '190850'));
  if (isMatch) {
    if (db.config.adminPin !== '190850') {
      db.config.adminPin = '190850';
      saveDatabase(db);
    }
    // Elevate current user if requested
    if (userId && db.users[userId]) {
      db.users[userId].role = 'admin';
      saveDatabase(db);
      return res.json({ 
        success: true, 
        message: 'ยืนยันรหัสความปลอดภัย Admin สำเร็จ (190850)', 
        user: db.users[userId] 
      });
    }

    // Or provide admin account
    const adminUser = db.users['admin-user'] || {
      id: 'admin-user',
      email: 'jtinx97@gmail.com',
      name: 'เจ้าของร้าน AngusShopX (Admin)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      balance: 9999,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    db.users['admin-user'] = adminUser;
    saveDatabase(db);

    return res.json({ 
      success: true, 
      message: 'ยืนยันรหัสความปลอดภัย Admin สำเร็จ (190850)',
      user: adminUser,
    });
  }
  return res.status(401).json({ success: false, message: 'รหัส Admin PIN ไม่ถูกต้อง (กรุณาใช้รหัส 190850)' });
});

// Google OAuth Popup Callback Handler
app.get('/auth/callback', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>เข้าสู่ระบบสำเร็จ - AngusShopX</title>
  <style>
    body {
      background: #0b0616;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .box {
      text-align: center;
      background: #160c2d;
      padding: 2.5rem;
      border-radius: 1.5rem;
      border: 1px solid rgba(168,85,247,0.4);
      box-shadow: 0 0 40px rgba(147,51,234,0.3);
      max-width: 360px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(168,85,247,0.2);
      border-top-color: #c084fc;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.25rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 0.5rem; font-size: 1.15rem; color: #fff; }
    p { margin: 0; color: #d8b4fe; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h2>เข้าสู่ระบบด้วย Google สำเร็จ!</h2>
    <p>กำลังกลับสู่หน้าร้านค้าและซิงค์บัญชี...</p>
  </div>
  <script>
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'SUPABASE_GOOGLE_AUTH_SUCCESS',
        hash: hash,
        search: search
      }, '*');
      setTimeout(() => {
        window.close();
      }, 800);
    } else {
      setTimeout(() => {
        window.location.href = '/' + (hash || search);
      }, 500);
    }
  </script>
</body>
</html>`);
});

// Store public config
app.get('/api/store/config', (req, res) => {
  res.json({
    success: true,
    data: {
      storeName: db.config.storeName,
      bankName: db.config.bankName,
      bankAccount: db.config.bankAccount,
      bankAccountName: db.config.bankAccountName,
      truemoneyPhone: db.config.truemoneyPhone,
      announcement: db.config.announcement,
      supabaseUrl: db.config.supabaseUrl,
      supabaseConnected: !!supabaseServer,
    }
  });
});

// Update store config (Admin Protected)
app.post('/api/store/config', (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { bankAccount, bankAccountName, truemoneyPhone, slipokApiKey, slipokApiUrl, announcement, supabaseUrl, supabaseAnonKey, newAdminPin } = req.body;
  if (bankAccount) db.config.bankAccount = bankAccount;
  if (bankAccountName) db.config.bankAccountName = bankAccountName;
  if (truemoneyPhone) db.config.truemoneyPhone = truemoneyPhone;
  if (slipokApiKey) db.config.slipokApiKey = slipokApiKey;
  if (slipokApiUrl) db.config.slipokApiUrl = slipokApiUrl;
  if (announcement !== undefined) db.config.announcement = announcement;
  if (supabaseUrl) db.config.supabaseUrl = supabaseUrl;
  if (supabaseAnonKey !== undefined) db.config.supabaseAnonKey = supabaseAnonKey;
  if (newAdminPin && newAdminPin.trim().length >= 4) db.config.adminPin = newAdminPin.trim();
  
  saveDatabase(db);
  initSupabaseServer();

  res.json({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', config: db.config });
});

// Supabase Status and Table Verification
app.get('/api/supabase/status', async (req, res) => {
  if (!supabaseServer) {
    return res.json({
      connected: false,
      allTablesExist: false,
      message: 'ยังไม่ได้ใส่ Supabase Anon Key หรือตั้งค่า URL',
      url: db.config.supabaseUrl,
      tables: {
        profiles: false,
        products: false,
        stock: false,
        orders: false,
        transactions: false,
      },
      missingTables: ['profiles', 'products', 'stock', 'orders', 'transactions'],
      localUsersCount: Object.keys(db.users).length,
      syncedUsersCount: 0,
      googleCallbackUrl: `${db.config.supabaseUrl}/auth/v1/callback`,
    });
  }

  try {
    // Test each table individually
    const checkTable = async (tableName: string) => {
      try {
        const { error } = await supabaseServer!.from(tableName).select('id').limit(1);
        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
            return false;
          }
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };

    const [hasProfiles, hasProducts, hasStock, hasOrders, hasTransactions] = await Promise.all([
      checkTable('profiles'),
      checkTable('products'),
      checkTable('stock'),
      checkTable('orders'),
      checkTable('transactions'),
    ]);

    const tables = {
      profiles: hasProfiles,
      products: hasProducts,
      stock: hasStock,
      orders: hasOrders,
      transactions: hasTransactions,
    };

    const missingTables = Object.entries(tables)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name);

    const allTablesExist = missingTables.length === 0;

    let syncedUsersCount = 0;
    if (hasProfiles) {
      try {
        const { count } = await supabaseServer.from('profiles').select('*', { count: 'exact', head: true });
        syncedUsersCount = count || 0;
      } catch (e) {}
    }

    let message = '';
    if (allTablesExist) {
      message = `เชื่อมต่อ Supabase สำเร็จสมบูรณ์! ตารางครบทั้ง 5 ตาราง (Profiles, Products, Stock, Orders, Transactions)`;
    } else {
      message = `เชื่อมต่อ Supabase ได้แล้ว แต่ยังขาดตาราง: ${missingTables.join(', ')} (กรุณาคัดลอก SQL ด้านล่างไปรันใน Supabase SQL Editor)`;
    }

    return res.json({
      connected: true,
      allTablesExist,
      message,
      url: db.config.supabaseUrl,
      tables,
      missingTables,
      localUsersCount: Object.keys(db.users).length,
      syncedUsersCount,
      googleCallbackUrl: `${db.config.supabaseUrl}/auth/v1/callback`,
    });
  } catch (err: any) {
    return res.json({
      connected: false,
      allTablesExist: false,
      message: err.message || 'เชื่อมต่อ Supabase ล้มเหลว',
      url: db.config.supabaseUrl,
      tables: { profiles: false, products: false, stock: false, orders: false, transactions: false },
      missingTables: ['profiles', 'products', 'stock', 'orders', 'transactions'],
    });
  }
});

// Admin: Sync All Local Data to Supabase (Users, Products, Stock, Orders, Transactions)
app.post('/api/supabase/sync-all', async (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }

  if (!supabaseServer) {
    return res.status(400).json({ success: false, message: 'ยังไม่ได้เชื่อมต่อ Supabase Client' });
  }

  const results = {
    usersSynced: 0,
    productsSynced: 0,
    stockSynced: 0,
    ordersSynced: 0,
    transactionsSynced: 0,
    errors: [] as string[],
  };

  try {
    // 1. Sync Profiles
    const usersList = Object.values(db.users);
    for (const u of usersList) {
      try {
        const { error } = await supabaseServer.from('profiles').upsert({
          id: u.id,
          email: u.email,
          name: u.name || u.email.split('@')[0],
          avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`,
          balance: Number(u.balance) || 0,
          role: u.role || 'user',
        });
        if (error) {
          results.errors.push(`Profile ${u.email}: ${error.message}`);
        } else {
          results.usersSynced++;
        }
      } catch (e: any) {
        results.errors.push(`Profile ${u.email}: ${e.message}`);
      }
    }

    // 2. Sync Products
    for (const p of db.products) {
      try {
        const { error } = await supabaseServer.from('products').upsert({
          id: p.id,
          name: p.name,
          category: p.category,
          category_label: p.categoryLabel,
          price: Number(p.price),
          original_price: p.originalPrice ? Number(p.originalPrice) : null,
          description: p.description,
          details: Array.isArray(p.details) ? p.details : [],
          image: p.image,
          badge: p.badge,
          featured: Boolean(p.featured),
          stock_count: Number(p.stockCount) || 0,
          created_at: p.createdAt || new Date().toISOString(),
        });
        if (error) {
          results.errors.push(`Product ${p.name}: ${error.message}`);
        } else {
          results.productsSynced++;
        }
      } catch (e: any) {
        results.errors.push(`Product ${p.name}: ${e.message}`);
      }
    }

    // 3. Sync Stock
    for (const s of db.stock) {
      try {
        const { error } = await supabaseServer.from('stock').upsert({
          id: s.id,
          product_id: s.productId,
          credentials: s.credentials,
          is_used: Boolean(s.isUsed),
          order_id: s.orderId || null,
          added_at: s.addedAt || new Date().toISOString(),
        });
        if (error) {
          results.errors.push(`Stock ${s.id}: ${error.message}`);
        } else {
          results.stockSynced++;
        }
      } catch (e: any) {
        results.errors.push(`Stock ${s.id}: ${e.message}`);
      }
    }

    // 4. Sync Orders
    for (const o of db.orders) {
      try {
        const { error } = await supabaseServer.from('orders').upsert({
          id: o.id,
          user_id: o.userId,
          user_email: o.userEmail,
          items: o.items,
          total_amount: Number(o.totalAmount),
          discount_amount: Number(o.discountAmount || 0),
          coupon_code: o.couponCode || null,
          status: o.status || 'completed',
          created_at: o.createdAt || new Date().toISOString(),
        });
        if (error) {
          results.errors.push(`Order ${o.id}: ${error.message}`);
        } else {
          results.ordersSynced++;
        }
      } catch (e: any) {
        results.errors.push(`Order ${o.id}: ${e.message}`);
      }
    }

    // 5. Sync Transactions
    for (const tx of db.transactions) {
      try {
        const { error } = await supabaseServer.from('transactions').upsert({
          id: tx.id,
          user_id: tx.userId,
          user_email: tx.userEmail,
          method: tx.method,
          amount: Number(tx.amount),
          status: tx.status || 'success',
          receiving_acc: tx.receivingAcc || null,
          voucher_hash: tx.voucherHash || null,
          created_at: tx.createdAt || new Date().toISOString(),
        });
        if (error) {
          results.errors.push(`Tx ${tx.id}: ${error.message}`);
        } else {
          results.transactionsSynced++;
        }
      } catch (e: any) {
        results.errors.push(`Tx ${tx.id}: ${e.message}`);
      }
    }

    const hasMissing = results.errors.some(e => e.includes('Could not find the table') || e.includes('schema cache'));
    const message = hasMissing
      ? '⚠️ ไม่สามารถซิงค์ได้เนื่องจากยังไม่ได้สร้างตารางใน Supabase: กรุณารันคำสั่ง SQL ใน Supabase SQL Editor ก่อน'
      : `ซิงค์เข้า Supabase สำเร็จ! (บัญชี: ${results.usersSynced}, สินค้า: ${results.productsSynced}, สต็อก: ${results.stockSynced}, รายการเติมเงิน: ${results.transactionsSynced})`;

    return res.json({
      success: !hasMissing,
      message,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการซิงค์: ${err.message}`,
      results,
    });
  }
});

// List products (From Supabase if available, else local storage)
app.get('/api/products', async (req, res) => {
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from('products').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        // Map from snake_case if needed
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          categoryLabel: p.category_label || p.category,
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          description: p.description || '',
          details: Array.isArray(p.details) ? p.details : [],
          image: p.image,
          badge: p.badge,
          featured: p.featured,
          stockCount: p.stock_count || 0,
          createdAt: p.created_at,
        }));
        return res.json({ success: true, products: mapped, source: 'supabase' });
      }
    } catch (e) {
      console.warn('[Supabase Products fetch fallback]:', e);
    }
  }

  syncStockCounts();
  res.json({ success: true, products: db.products, source: 'local' });
});

// Create or update product (Admin Protected)
app.post('/api/products', async (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { id, name, category, categoryLabel, price, originalPrice, description, details, image, badge, featured } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อสินค้าและราคา' });
  }

  const prodId = id || `prod-${Date.now()}`;
  const prodObj = {
    id: prodId,
    name,
    category: category || 'godhuman',
    categoryLabel: categoryLabel || 'หมัดก็อด + CDK',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    description: description || '',
    details: Array.isArray(details) ? details : (details ? details.split('\n').filter(Boolean) : []),
    image: image || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    badge: badge || 'ใหม่ 🔥',
    featured: !!featured,
    stockCount: 0,
    createdAt: new Date().toISOString(),
  };

  const existingIdx = db.products.findIndex(p => p.id === prodId);
  if (existingIdx >= 0) {
    prodObj.stockCount = db.products[existingIdx].stockCount;
    prodObj.createdAt = db.products[existingIdx].createdAt;
    db.products[existingIdx] = prodObj;
  } else {
    db.products.unshift(prodObj);
  }
  saveDatabase(db);

  // Sync to Supabase
  if (supabaseServer) {
    try {
      await supabaseServer.from('products').upsert({
        id: prodObj.id,
        name: prodObj.name,
        category: prodObj.category,
        category_label: prodObj.categoryLabel,
        price: prodObj.price,
        original_price: prodObj.originalPrice,
        description: prodObj.description,
        details: prodObj.details,
        image: prodObj.image,
        badge: prodObj.badge,
        featured: prodObj.featured,
        stock_count: prodObj.stockCount,
        created_at: prodObj.createdAt,
      });
    } catch (err) {
      console.warn('[Supabase Sync Product Error]:', err);
    }
  }

  res.json({ success: true, product: prodObj });
});

// Delete product (Admin Protected)
app.delete('/api/products/:id', async (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { id } = req.params;
  db.products = db.products.filter(p => p.id !== id);
  db.stock = db.stock.filter(s => s.productId !== id || s.isUsed);
  saveDatabase(db);

  if (supabaseServer) {
    try {
      await supabaseServer.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase Delete Product Error]:', e);
    }
  }

  res.json({ success: true, message: 'ลบสินค้าเรียบร้อย' });
});

// Get stock items for product (Admin)
app.get('/api/products/:id/stock', (req, res) => {
  const { id } = req.params;
  const items = db.stock.filter(s => s.productId === id);
  res.json({ success: true, stock: items });
});

// Add stock items (Bulk or Single) (Admin Protected)
app.post('/api/products/:id/stock', async (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { id } = req.params;
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลรหัสผ่าน' });
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    return res.status(400).json({ success: false, message: 'ไม่พบรายการสต็อก' });
  }

  const added: any[] = [];
  lines.forEach((line) => {
    const item = {
      id: `stk-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: id,
      credentials: line,
      addedAt: new Date().toISOString(),
      isUsed: false,
    };
    db.stock.push(item);
    added.push(item);
  });

  syncStockCounts();
  saveDatabase(db);

  // Sync to Supabase
  if (supabaseServer) {
    try {
      const dbRows = added.map(a => ({
        id: a.id,
        product_id: a.productId,
        credentials: a.credentials,
        is_used: false,
        added_at: a.addedAt,
      }));
      await supabaseServer.from('stock').insert(dbRows);
      // update product stock count
      const prod = db.products.find(p => p.id === id);
      if (prod) {
        await supabaseServer.from('products').update({ stock_count: prod.stockCount }).eq('id', id);
      }
    } catch (e) {
      console.warn('[Supabase Sync Stock Error]:', e);
    }
  }

  res.json({ success: true, addedCount: added.length, message: `เพิ่มสต็อกสำเร็จ ${added.length} รายการ` });
});

// Delete individual stock item (Admin Protected)
app.delete('/api/products/:productId/stock/:stockId', async (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { productId, stockId } = req.params;
  const initialCount = db.stock.length;
  db.stock = db.stock.filter(s => !(s.productId === productId && s.id === stockId));
  
  const wasDeleted = db.stock.length < initialCount;
  if (!wasDeleted) {
    return res.status(404).json({ success: false, message: 'ไม่พบไอดีในสต็อกนี้' });
  }

  syncStockCounts();
  saveDatabase(db);

  if (supabaseServer) {
    try {
      await supabaseServer.from('stock').delete().eq('id', stockId);
      const prod = db.products.find(p => p.id === productId);
      if (prod) {
        await supabaseServer.from('products').update({ stock_count: prod.stockCount }).eq('id', productId);
      }
    } catch (e) {
      console.warn('[Supabase Delete Stock Error]:', e);
    }
  }

  const remaining = db.stock.filter(s => s.productId === productId);
  res.json({ 
    success: true, 
    message: 'ลบไอดีออกจากสต็อกเรียบร้อยแล้ว',
    stock: remaining,
    remainingCount: remaining.filter(s => !s.isUsed).length
  });
});

// Quick 1-Step Add Product & Stock (Admin Protected)
app.post('/api/products/quick-add', async (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { name, price, category, categoryLabel, credentials, image, badge, description, details } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อสินค้าและราคา' });
  }

  const prodId = `prod-${Date.now()}`;
  const prodObj = {
    id: prodId,
    name: name.trim(),
    category: category || 'godhuman',
    categoryLabel: categoryLabel || 'หมัดก็อด + CDK',
    price: Number(price),
    description: description || '',
    details: Array.isArray(details) ? details : (details ? details.split('\n').filter(Boolean) : ['ไอดีสะอาด 100%', 'จัดส่งอัตโนมัติ']),
    image: image || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    badge: badge || 'ใหม่ 🔥',
    featured: true,
    stockCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(prodObj);

  // Add credentials if provided
  const addedStockItems: any[] = [];
  if (credentials && typeof credentials === 'string' && credentials.trim().length > 0) {
    const lines = credentials.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    lines.forEach((line) => {
      const item = {
        id: `stk-${prodId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prodId,
        credentials: line,
        addedAt: new Date().toISOString(),
        isUsed: false,
      };
      db.stock.push(item);
      addedStockItems.push(item);
    });
  }

  syncStockCounts();
  saveDatabase(db);

  if (supabaseServer) {
    try {
      await supabaseServer.from('products').insert({
        id: prodObj.id,
        name: prodObj.name,
        category: prodObj.category,
        category_label: prodObj.categoryLabel,
        price: prodObj.price,
        description: prodObj.description,
        details: prodObj.details,
        image: prodObj.image,
        badge: prodObj.badge,
        featured: prodObj.featured,
        stock_count: prodObj.stockCount,
        created_at: prodObj.createdAt,
      });

      if (addedStockItems.length > 0) {
        const dbRows = addedStockItems.map(a => ({
          id: a.id,
          product_id: a.productId,
          credentials: a.credentials,
          is_used: false,
          added_at: a.addedAt,
        }));
        await supabaseServer.from('stock').insert(dbRows);
      }
    } catch (e) {
      console.warn('[Supabase Quick Add Error]:', e);
    }
  }

  res.json({
    success: true,
    message: `เพิ่มสินค้า "${prodObj.name}" และสต็อก ${addedStockItems.length} ไอดีสำเร็จ!`,
    product: prodObj,
    stockAdded: addedStockItems.length,
  });
});

// Admin: Get all transactions
app.get('/api/admin/transactions', (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  res.json({ success: true, transactions: db.transactions });
});

// Admin: Approve pending transaction
app.post('/api/admin/transactions/:id/approve', async (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { id } = req.params;
  const { manualAmount } = req.body;
  const tx = db.transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการธุรกรรมนี้' });
  }

  const finalAmount = Number(manualAmount) || tx.amount || 0;
  if (finalAmount <= 0) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุยอดเงินที่ถูกต้อง' });
  }

  const user = db.users[tx.userId];
  if (!user) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้ของรายการนี้' });
  }

  tx.status = 'success';
  tx.amount = finalAmount;
  user.balance = (user.balance || 0) + finalAmount;

  saveDatabase(db);
  await syncUserToSupabase(user);

  res.json({ 
    success: true, 
    message: `อนุมัติเติมเงิน ${finalAmount.toLocaleString()} บาท ให้ผู้ใช้ ${user.name || user.email} สำเร็จ!`,
    transaction: tx,
    newBalance: user.balance,
  });
});

// Admin: Reject pending transaction
app.post('/api/admin/transactions/:id/reject', (req, res) => {
  if (!verifyAdminPin(req)) {
    return res.status(403).json({ success: false, message: 'ความปลอดภัย: รหัส Admin PIN ไม่ถูกต้อง' });
  }
  const { id } = req.params;
  const { reason } = req.body;
  const tx = db.transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการธุรกรรมนี้' });
  }

  tx.status = 'failed';
  tx.rawResponse = { ...tx.rawResponse, rejectReason: reason || 'สลิปไม่ถูกต้อง หรือยอดเงินไม่ตรง' };
  saveDatabase(db);

  res.json({ success: true, message: 'ปฏิเสธรายการเรียบร้อยแล้ว', transaction: tx });
});

// User Registration (Deprecated - Google Login Only)
app.post('/api/user/register', async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'ระบบปิดการสมัครสมาชิกแบบกรอกเองแล้ว กรุณาเข้าสู่ระบบด้วย Google (Google Sign-In)',
  });
});

// User Login (Supports Auto-Registration if not yet registered)
app.post('/api/user/login', async (req, res) => {
  const { email, password, autoRegister, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมล/ไอดี และรหัสผ่าน' });
  }

  const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, '');
  const cleanId = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@angusshopx.com`;
  const userId = `usr-${encodeURIComponent(cleanId).replace(/[%@.]/g, '_')}`;

  if (!db.users[userId]) {
    if (autoRegister) {
      const finalDisplayName = (name && name.trim()) ? name.trim() : (cleanEmail.split('@')[0] || 'ลูกค้าใหม่');
      db.users[userId] = {
        id: userId,
        email: cleanId,
        name: finalDisplayName,
        password: password,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanId}`,
        balance: 0,
        role: cleanId === 'jtinx97@gmail.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };
      saveDatabase(db);
      await syncUserToSupabase(db.users[userId]);

      return res.json({
        success: true,
        message: `สมัครสมาชิกใหม่และเข้าสู่ระบบสำเร็จ! (ชื่อ: ${finalDisplayName})`,
        user: db.users[userId],
        isNewUser: true,
      });
    }

    return res.status(404).json({
      success: false,
      notRegistered: true,
      message: 'รหัสหรืออีเมลนี้ยังไม่ได้สมัครสมาชิก กดปุ่ม "สมัครสมาชิก" ด้านล่างเพื่อสมัครทันที',
    });
  }

  const user = db.users[userId];
  if (user.password && user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    });
  }

  if (!user.password) {
    user.password = password;
    saveDatabase(db);
  }

  return res.json({
    success: true,
    message: `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับ ${user.name}!`,
    user,
  });
});

// Fast 1-Second User Auth / Gmail Login / Supabase Sync
app.post('/api/user/auth', async (req, res) => {
  const { id, email, name, avatar } = req.body;
  if (!id && !email) {
    return res.status(400).json({ success: false, message: 'Missing user credentials' });
  }

  const rawEmail = (email || '').trim().toLowerCase();
  const cleanEmail = rawEmail.includes('@') ? rawEmail : (rawEmail ? `${rawEmail}@gmail.com` : '');
  const targetId = id || (cleanEmail ? `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : `usr-${Date.now()}`);

  // Find existing user by ID or by email
  let existingKey = Object.keys(db.users).find(k => {
    const u = db.users[k];
    if (k === targetId) return true;
    if (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) return true;
    if (id && u.id === id) return true;
    return false;
  });

  const userId = existingKey || targetId;
  const isAdmin = cleanEmail === 'jtinx97@gmail.com';

  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      email: cleanEmail || `${userId}@gmail.com`,
      name: name || (cleanEmail ? cleanEmail.split('@')[0] : 'ลูกค้า AngusShopX'),
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userId)}`,
      balance: isAdmin ? 10199 : 0,
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };
  } else {
    if (name && name.trim()) db.users[userId].name = name.trim();
    if (avatar) db.users[userId].avatar = avatar;
    if (isAdmin) {
      db.users[userId].role = 'admin';
      if ((db.users[userId].balance || 0) <= 0) {
        db.users[userId].balance = 10199;
      }
    }
  }

  saveDatabase(db);
  await syncUserToSupabase(db.users[userId]);

  res.json({ 
    success: true, 
    user: db.users[userId],
    adminPin: isAdmin ? '190850' : undefined,
    message: isAdmin ? 'เข้าสู่ระบบในฐานะเจ้าของร้าน/แอดมิน สำเร็จ!' : `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${db.users[userId].name}!`
  });
});

// Get user profile
app.get('/api/user/profile', (req, res) => {
  const userId = (req.query.userId as string) || 'admin-user';
  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

// -------------------------------------------------------------
// TOPUP: SLIPOK API (กสิกรไทย 1668303060 กฤตินสุโขพล)
// -------------------------------------------------------------
app.post('/api/topup/slipok', upload.single('slip'), async (req, res) => {
  try {
    const userId = req.body.userId || 'admin-user';
    const user = db.users[userId];
    if (!user) {
      return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    const file = req.file;
    if (!file && !req.body.slipBase64) {
      return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปภาพสลิปธนาคาร' });
    }

    const slipokUrl = db.config.slipokApiUrl || 'https://api.slipok.com/api/line/apikey/77989';
    const slipokApiKey = db.config.slipokApiKey || 'SLIPOKMU0I0O9';
    const expectedAcc = db.config.bankAccount || '1668303060';

    let slipokResponseData: any = null;
    let verifiedAmount = 0;
    let transRef = '';
    let senderName = '';
    let senderBank = '';
    let transDate = '';

    const fileBuffer = file ? file.buffer : Buffer.from(req.body.slipBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const fileName = file ? file.originalname : 'slip.jpg';
    const mimeType = file ? file.mimetype : 'image/jpeg';

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    formData.append('files', blob, fileName);

    console.log(`[SlipOK Request] Calling: ${slipokUrl} with API key: ${slipokApiKey}`);

    try {
      const response = await fetch(slipokUrl, {
        method: 'POST',
        headers: {
          'x-authorization': slipokApiKey,
        },
        body: formData,
      });

      slipokResponseData = await response.json();
      console.log('[SlipOK Response]:', JSON.stringify(slipokResponseData));
    } catch (slipErr: any) {
      console.error('[SlipOK Request Error]:', slipErr);
    }

    // Inspect SlipOK Response structure:
    // Case 1: SlipOK success:
    // { success: true, data: { success: true, data: { transRef, amount, receiver: { ... } } } }
    // Or { success: true, data: { transRef, amount, ... } }
    const isSuccess = slipokResponseData && (
      slipokResponseData.success === true ||
      slipokResponseData.data?.success === true ||
      (slipokResponseData.data && !slipokResponseData.error && slipokResponseData.data.amount)
    );

    if (isSuccess) {
      const inner = slipokResponseData.data?.data || slipokResponseData.data || slipokResponseData;
      transRef = inner.transRef || `REF-${Date.now()}`;
      verifiedAmount = parseFloat(inner.amount || 0);
      senderName = inner.sender?.displayName || inner.sender?.name || 'ลูกค้าผู้โอนเงิน';
      senderBank = inner.sendingBank || 'ธนาคารไทย';
      transDate = inner.transDate || new Date().toISOString();

      // Check duplicate transRef
      const alreadyUsed = db.transactions.some(t => t.transRef && t.transRef === transRef && t.status === 'success');
      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: `สลิปนี้ถูกใช้งานไปแล้วในระบบ (Ref: ${transRef}) ไม่สามารถใช้ซ้ำได้!`,
          transRef,
        });
      }

      // Check receiving account
      const receiverAcc = inner.receiver?.account?.value || inner.receiver?.account || '';
      if (receiverAcc && !receiverAcc.includes(expectedAcc.slice(-6)) && !receiverAcc.includes(expectedAcc)) {
        return res.status(400).json({
          success: false,
          message: `สลิปนี้ไม่ได้โอนเข้าบัญชีกสิกรไทยของร้าน (${expectedAcc})! บัญชีในสลิป: ${receiverAcc}`,
          receiverAccount: receiverAcc,
        });
      }
    } else {
      const errMsg = slipokResponseData?.message || slipokResponseData?.data?.message || 'ไม่สามารถตรวจสอบสลิปได้ (ภาพสลิปไม่ชัดเจน หรือไม่มี QR Code)';
      
      // If customer requests submitting slip for admin review
      if (req.body.submitReview === 'true') {
        const claimedAmount = Number(req.body.claimedAmount) || 0;
        const slipImageBase64 = file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : req.body.slipBase64;
        const pendingTx = {
          id: `tx-pending-${Date.now()}`,
          userId: user.id,
          userEmail: user.email,
          method: 'slipok_kbank',
          amount: claimedAmount,
          transRef: `MANUAL-${Date.now()}`,
          senderName: user.name || 'ลูกค้ารอตรวจสอบสลิป',
          senderBank: 'KBANK/PromptPay',
          receivingAcc: expectedAcc,
          status: 'pending',
          slipImage: slipImageBase64,
          createdAt: new Date().toISOString(),
          rawResponse: { reason: errMsg, claimedAmount },
        };
        db.transactions.unshift(pendingTx);
        saveDatabase(db);

        return res.json({
          success: true,
          pending: true,
          message: 'ส่งสลิปให้แอดมินตรวจสอบเรียบร้อย! เจ้าหน้าที่จะตรวจสอบยอดเงินและอนุมัติเครดิตเข้ากระเป๋าของคุณโดยเร็วที่สุด',
          transaction: pendingTx,
        });
      }

      return res.status(400).json({
        success: false,
        canSubmitReview: true,
        message: `การตรวจสอบสลิปอัตโนมัติไม่สำเร็จ: ${errMsg}`,
        raw: slipokResponseData,
      });
    }

    if (verifiedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'ยอดเงินในสลิปไม่ถูกต้อง' });
    }

    // Add balance to user
    user.balance = (user.balance || 0) + verifiedAmount;

    // Record transaction
    const tx = {
      id: `tx-slip-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      method: 'slipok_kbank',
      amount: verifiedAmount,
      transRef,
      senderName,
      senderBank,
      receivingAcc: expectedAcc,
      status: 'success',
      createdAt: new Date().toISOString(),
      rawResponse: slipokResponseData,
    };
    db.transactions.unshift(tx);
    saveDatabase(db);

    // Sync to Supabase
    await syncUserToSupabase(user);
    if (supabaseServer) {
      try {
        await supabaseServer.from('transactions').insert({
          id: tx.id,
          user_id: tx.userId,
          user_email: tx.userEmail,
          method: tx.method,
          amount: tx.amount,
          trans_ref: tx.transRef,
          sender_name: tx.senderName,
          sender_bank: tx.senderBank,
          receiving_acc: tx.receivingAcc,
          status: 'success',
          created_at: tx.createdAt,
        });
      } catch (e) {
        console.warn('[Supabase Sync Transaction Error]:', e);
      }
    }

    return res.json({
      success: true,
      message: `เติมเงินสำเร็จเรียบร้อยแล้ว จำนวน ${verifiedAmount.toLocaleString()} บาท`,
      amount: verifiedAmount,
      newBalance: user.balance,
      transaction: tx,
      sender: senderName,
      bank: senderBank,
      transRef,
    });
  } catch (error: any) {
    console.error('SlipOK error:', error);
    return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป' });
  }
});

// -------------------------------------------------------------
// TOPUP: TRUEMONEY WALLET VOUCHER (เบอร์ 0829848852)
// -------------------------------------------------------------
app.post('/api/topup/truemoney', async (req, res) => {
  try {
    const { voucherUrl, userId } = req.body;
    const currentUserId = userId || 'admin-user';
    const user = db.users[currentUserId];

    if (!user) {
      return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    if (!voucherUrl) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุลิงก์ซองของขวัญ TrueMoney Wallet' });
    }

    // Extract voucher code from URL or raw string: v=([a-zA-Z0-9]+)
    const voucherMatch = voucherUrl.match(/v=([a-zA-Z0-9]+)/) || voucherUrl.match(/([a-zA-Z0-9]{15,40})/);
    const voucherHash = voucherMatch ? voucherMatch[1] : voucherUrl.trim();

    if (!voucherHash || voucherHash.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'ลิงก์ซองของขวัญไม่ถูกต้อง (ตัวอย่าง: https://gift.truemoney.com/campaign/?v=xxxxxx)'
      });
    }

    // Check duplicate voucher hash
    const alreadyUsed = db.transactions.some(t => t.voucherHash === voucherHash && t.status === 'success');
    if (alreadyUsed) {
      return res.status(400).json({
        success: false,
        message: 'ซองของขวัญนี้ถูกรับไปแล้วในระบบ AngusShopX!'
      });
    }

    const storePhone = db.config.truemoneyPhone || '0829848852';

    // Call TrueMoney official gift voucher redeem API
    let tmResponse: any = null;
    let redeemedAmount = 0;

    try {
      const tmUrl = `https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`;
      console.log(`[TrueMoney Redeem] Redeeming voucher ${voucherHash} to phone ${storePhone}`);

      const response = await fetch(tmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          mobile: storePhone,
          voucher_hash: voucherHash,
        }),
      });

      tmResponse = await response.json();
      console.log('[TrueMoney Response]:', JSON.stringify(tmResponse));
    } catch (err: any) {
      console.error('[TrueMoney API Call Error]:', err);
    }

    if (tmResponse && tmResponse.status?.code === 'SUCCESS') {
      const amountStr = tmResponse.data?.voucher?.redeemed_amount_baht || tmResponse.data?.my_ticket?.amount_baht || '0';
      redeemedAmount = parseFloat(amountStr);
    } else {
      const errorMsg = tmResponse?.status?.message || 'ซองของขวัญไม่ถูกต้อง หมดอายุ หรือมีผู้รับไปแล้ว';
      return res.status(400).json({
        success: false,
        message: `เติมเงิน TrueMoney ไม่สำเร็จ: ${errorMsg}`,
        raw: tmResponse,
      });
    }

    if (redeemedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'ยอดเงินในซองของขวัญไม่ถูกต้อง' });
    }

    // Add balance to user
    user.balance = (user.balance || 0) + redeemedAmount;

    // Save transaction
    const tx = {
      id: `tx-tm-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      method: 'truemoney_voucher',
      amount: redeemedAmount,
      voucherHash,
      status: 'success',
      receivingAcc: storePhone,
      createdAt: new Date().toISOString(),
      rawResponse: tmResponse,
    };
    db.transactions.unshift(tx);
    saveDatabase(db);

    // Sync to Supabase
    await syncUserToSupabase(user);
    if (supabaseServer) {
      try {
        await supabaseServer.from('transactions').insert({
          id: tx.id,
          user_id: tx.userId,
          user_email: tx.userEmail,
          method: tx.method,
          amount: tx.amount,
          voucher_hash: tx.voucherHash,
          receiving_acc: tx.receivingAcc,
          status: 'success',
          created_at: tx.createdAt,
        });
      } catch (e) {
        console.warn('[Supabase Sync TM Transaction Error]:', e);
      }
    }

    return res.json({
      success: true,
      message: `เติมเงิน TrueMoney สำเร็จ ${redeemedAmount.toLocaleString()} บาท เข้าสู่บัญชี AngusShopX เรียบร้อย!`,
      amount: redeemedAmount,
      newBalance: user.balance,
      transaction: tx,
    });
  } catch (error: any) {
    console.error('TrueMoney error:', error);
    return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดในการรับซองของขวัญ' });
  }
});

// -------------------------------------------------------------
// CART & CHECKOUT
// -------------------------------------------------------------
app.post('/api/cart/checkout', async (req, res) => {
  const { userId, items, couponCode } = req.body;
  const currentUserId = userId || 'admin-user';
  const user = db.users[currentUserId];

  if (!user) {
    return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'ไม่มีสินค้าในตะกร้า' });
  }

  syncStockCounts();

  let totalAmount = 0;
  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `ไม่พบสินค้า ID: ${item.productId}` });
    }
    const availableStock = db.stock.filter(s => s.productId === item.productId && !s.isUsed).length;
    if (availableStock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `สินค้า "${product.name}" สต็อกไม่เพียงพอ (คงเหลือ ${availableStock} ชิ้น, ท่านสั่งซื้อ ${item.quantity} ชิ้น)`
      });
    }
    totalAmount += product.price * item.quantity;
  }

  // Apply Coupon
  let discountAmount = 0;
  if (couponCode) {
    const upperCoupon = couponCode.trim().toUpperCase();
    if (upperCoupon === 'ANGUS10') {
      discountAmount = Math.round(totalAmount * 0.1);
    } else if (upperCoupon === 'NEWBIE50' && totalAmount >= 200) {
      discountAmount = 50;
    } else if (upperCoupon === 'VIP20') {
      discountAmount = Math.round(totalAmount * 0.2);
    }
  }

  const finalTotal = Math.max(0, totalAmount - discountAmount);

  if (user.balance < finalTotal) {
    const missing = finalTotal - user.balance;
    return res.status(400).json({
      success: false,
      message: `ยอดเงินคงเหลือไม่เพียงพอ (ขาดอีก ${missing.toLocaleString()} บาท) กรุณาเติมเงินก่อนทำรายการ`,
      currentBalance: user.balance,
      requiredAmount: finalTotal,
      missingAmount: missing,
    });
  }

  // Deduct balance
  user.balance -= finalTotal;

  // Dispense stock accounts
  const orderId = `ORD-${Date.now()}`;
  const deliveredItems: any[] = [];

  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId)!;
    const availableItems = db.stock.filter(s => s.productId === item.productId && !s.isUsed);

    for (let q = 0; q < item.quantity; q++) {
      const stockItem = availableItems[q];
      stockItem.isUsed = true;
      stockItem.orderId = orderId;
      deliveredItems.push({
        productId: product.id,
        productName: product.name,
        credentials: stockItem.credentials,
        price: product.price,
      });

      // Update Supabase stock item if connected
      if (supabaseServer) {
        try {
          supabaseServer.from('stock').update({ is_used: true, order_id: orderId }).eq('id', stockItem.id);
        } catch (e) {}
      }
    }
  }

  syncStockCounts();

  const order = {
    id: orderId,
    userId: user.id,
    userEmail: user.email,
    items: deliveredItems,
    totalAmount: finalTotal,
    discountAmount,
    couponCode: couponCode || undefined,
    createdAt: new Date().toISOString(),
    status: 'completed',
  };

  db.orders.unshift(order);
  saveDatabase(db);

  // Sync to Supabase
  await syncUserToSupabase(user);
  if (supabaseServer) {
    try {
      await supabaseServer.from('orders').insert({
        id: order.id,
        user_id: order.userId,
        user_email: order.userEmail,
        items: order.items,
        total_amount: order.totalAmount,
        discount_amount: order.discountAmount,
        coupon_code: order.couponCode,
        status: order.status,
        created_at: order.createdAt,
      });
    } catch (e) {
      console.warn('[Supabase Sync Order Error]:', e);
    }
  }

  return res.json({
    success: true,
    message: 'สั่งซื้อสำเร็จ! บัญชีไก่ตัน Blox Fruits ถูกส่งมอบเรียบร้อย',
    order,
    newBalance: user.balance,
  });
});

// Orders
app.get('/api/orders', (req, res) => {
  const userId = req.query.userId as string;
  const isAdmin = req.query.admin === 'true';

  if (isAdmin) {
    return res.json({ success: true, orders: db.orders });
  }

  if (!userId) {
    return res.json({ success: true, orders: db.orders.slice(0, 10) });
  }

  const userOrders = db.orders.filter(o => o.userId === userId);
  res.json({ success: true, orders: userOrders });
});

// Transactions
app.get('/api/transactions', (req, res) => {
  const userId = req.query.userId as string;
  const isAdmin = req.query.admin === 'true';

  if (isAdmin) {
    return res.json({ success: true, transactions: db.transactions });
  }

  if (userId) {
    const userTx = db.transactions.filter(t => t.userId === userId);
    return res.json({ success: true, transactions: userTx });
  }

  res.json({ success: true, transactions: db.transactions.slice(0, 20) });
});

// Admin stats
app.get('/api/admin/stats', (req, res) => {
  const totalRevenue = db.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalTopup = db.transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalAccountsSold = db.orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  const remainingStock = db.stock.filter(s => !s.isUsed).length;

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalTopup,
      totalAccountsSold,
      remainingStock,
      totalProducts: db.products.length,
      totalOrders: db.orders.length,
      totalUsers: Object.keys(db.users).length,
    }
  });
});

// -------------------------------------------------------------
// VITE INTEGRATION
// -------------------------------------------------------------
async function setupVite() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`[AngusShopX] Server running on port ${port} (http://localhost:${port})`);
  });
}

setupVite().catch(err => {
  console.error('Failed to start server:', err);
});
