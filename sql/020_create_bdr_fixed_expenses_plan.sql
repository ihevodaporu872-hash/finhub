-- Таблица для хранения годового плана ОФЗ (Постоянные коммерческие и управленческие расходы)
-- Сумма распределяется равномерно на 12 месяцев
-- При просмотре по проекту — распределение пропорционально доле проекта в общем выполнении

CREATE TABLE IF NOT EXISTS bdr_fixed_expenses_plan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(year)
);

-- RLS
ALTER TABLE bdr_fixed_expenses_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bdr_fixed_expenses_plan_all" ON bdr_fixed_expenses_plan
  FOR ALL USING (true) WITH CHECK (true);
