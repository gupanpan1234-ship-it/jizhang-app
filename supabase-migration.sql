-- 家庭记账 Supabase 数据库迁移
-- 在 Supabase SQL Editor 中运行此文件

-- 1. 家庭表
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 用户档案
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  budget NUMERIC(12,2),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 交易表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON transactions(family_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_family ON categories(family_id);

-- RLS 策略
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- families: 家庭成员可读
CREATE POLICY "Family members can view family"
  ON families FOR SELECT
  USING (id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- families: 创建者可插入
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (true);

-- profiles: 用户可读写自己的档案
CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- categories: 家庭成员可读
CREATE POLICY "Family members can view categories"
  ON categories FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- categories: 家庭成员可插入
CREATE POLICY "Family members can insert categories"
  ON categories FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- transactions: 家庭成员可读写
CREATE POLICY "Family members can view transactions"
  ON transactions FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Family members can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Family members can delete transactions"
  ON transactions FOR DELETE
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));
