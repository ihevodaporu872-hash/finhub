-- Трекер КС-6а: журнал физической готовности объекта
-- Линейный персонал регулярно вносит % выполнения по этапам

CREATE TABLE IF NOT EXISTS ks6a_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  stage_code TEXT NOT NULL,          -- код этапа (из SMR_CODES или custom)
  stage_name TEXT NOT NULL,          -- наименование этапа
  readiness_percent NUMERIC(5,2) NOT NULL DEFAULT 0, -- % физической готовности
  volume_done NUMERIC(15,2),         -- объём выполненных работ (опционально)
  volume_unit TEXT,                   -- единица измерения (м3, м2, шт и т.д.)
  note TEXT,                          -- примечание линейщика
  created_by UUID REFERENCES portal_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_ks6a_project ON ks6a_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_ks6a_date ON ks6a_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_ks6a_project_stage ON ks6a_entries(project_id, stage_code);

-- Уникальность: один проект + один этап + одна дата
CREATE UNIQUE INDEX IF NOT EXISTS idx_ks6a_unique
  ON ks6a_entries(project_id, stage_code, entry_date);

-- RLS
ALTER TABLE ks6a_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ks6a_entries_all" ON ks6a_entries
  FOR ALL USING (true) WITH CHECK (true);
