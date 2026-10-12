export const SUPABASE_SQL_SCHEMA = `-- AngusShopX: SQL Schema สำหรับรันใน Supabase (โปรเจกต์ anguskaituntheshop)
-- ไปที่ Supabase Dashboard > SQL Editor > New query > วางโค้ดนี้แล้วกด RUN

-- 1. ตารางสินค้า (Products)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'godhuman',
  category_label TEXT DEFAULT 'หมัดก็อด + CDK',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  description TEXT,
  details TEXT[] DEFAULT '{}',
  image TEXT,
  badge TEXT,
  featured BOOLEAN DEFAULT false,
  stock_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. ตารางสต็อกรหัสผ่าน (Stock Credentials)
CREATE TABLE IF NOT EXISTS public.stock (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  credentials TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  order_id TEXT,
  added_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. ตารางโปรไฟล์ผู้ใช้และกระเป๋าเงิน (Profiles & Wallet)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  balance NUMERIC DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. ตารางคำสั่งซื้อ (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. ตารางประวัติการเติมเงิน SlipOK & TrueMoney (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  method TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  trans_ref TEXT,
  sender_name TEXT,
  sender_bank TEXT,
  receiving_acc TEXT,
  voucher_hash TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- เปิด Row Level Security (RLS) และกำหนดสิทธิ์ Public Read/Write สำหรับการทำงานทันที
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- นโยบายเข้าถึงข้อมูล (Policies - Idempotent ป้องกัน error already exists)
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Stock" ON public.stock;
CREATE POLICY "Public Read Stock" ON public.stock FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
CREATE POLICY "Public Read Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Transactions" ON public.transactions;
CREATE POLICY "Public Read Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
`;
