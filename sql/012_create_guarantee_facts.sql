-- =============================================
-- Миграция 012: Таблица фактов возврата ГУ
-- =============================================

CREATE TABLE guarantee_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  fact_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  fact_date DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, month_key)
);

CREATE INDEX idx_guarantee_facts_project ON guarantee_facts(project_id);
CREATE INDEX idx_guarantee_facts_month ON guarantee_facts(month_key);

-- RLS
ALTER TABLE guarantee_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guarantee_facts_all" ON guarantee_facts
  FOR ALL USING (true) WITH CHECK (true);
