-- Плановый график 2.0: категории с расчётом стоимости
CREATE TABLE IF NOT EXISTS schedule_v2_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost_group TEXT NOT NULL CHECK (cost_group IN ('commercial', 'direct')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  volume NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '',
  price_per_unit NUMERIC DEFAULT 0,
  cost_materials NUMERIC DEFAULT 0,
  cost_labor NUMERIC DEFAULT 0,
  cost_sub_materials NUMERIC DEFAULT 0,
  cost_sub_labor NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name, cost_group)
);

-- Помесячные суммы по категориям
CREATE TABLE IF NOT EXISTS schedule_v2_monthly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES schedule_v2_categories(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, category_id, month_key)
);

-- Финансовые строки (Аванс, Зачет Аванса, ГУ и т.д.)
CREATE TABLE IF NOT EXISTS schedule_v2_finance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  row_code TEXT NOT NULL,
  month_key TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, row_code, month_key)
);

-- RLS
ALTER TABLE schedule_v2_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_v2_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_v2_finance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_v2_categories_all" ON schedule_v2_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "schedule_v2_monthly_all" ON schedule_v2_monthly FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "schedule_v2_finance_all" ON schedule_v2_finance FOR ALL USING (true) WITH CHECK (true);
