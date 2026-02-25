-- =============================================
-- Миграция 004: Таблицы для детализации поступлений БДДС
-- =============================================

-- Примечания по видам работ (одно на проект + вид работы)
CREATE TABLE bdds_income_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_type_code TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, work_type_code)
);

-- Суммы по месяцам (проект + вид работы + месяц)
CREATE TABLE bdds_income_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_type_code TEXT NOT NULL,
  month_key TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, work_type_code, month_key)
);

CREATE INDEX idx_bdds_income_entries_project ON bdds_income_entries(project_id);
CREATE INDEX idx_bdds_income_entries_month ON bdds_income_entries(month_key);
CREATE INDEX idx_bdds_income_notes_project ON bdds_income_notes(project_id);
