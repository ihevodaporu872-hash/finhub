-- БДР (Бюджет Доходов и Расходов) таблицы

-- Таблица план/факт значений БДР по строкам
CREATE TABLE bdr_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  row_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('plan', 'fact')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(row_code, year, month, entry_type)
);

CREATE INDEX idx_bdr_entries_year ON bdr_entries(year);
CREATE INDEX idx_bdr_entries_row_code ON bdr_entries(row_code);
CREATE INDEX idx_bdr_entries_year_type ON bdr_entries(year, entry_type);

-- Таблица записей суб-баз данных (единая для 5 типов)
CREATE TABLE bdr_sub_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_type TEXT NOT NULL CHECK (sub_type IN ('materials', 'labor', 'subcontract', 'design', 'rental')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bdr_sub_entries_sub_type ON bdr_sub_entries(sub_type);
CREATE INDEX idx_bdr_sub_entries_project ON bdr_sub_entries(project_id);
CREATE INDEX idx_bdr_sub_entries_date ON bdr_sub_entries(entry_date);
CREATE INDEX idx_bdr_sub_entries_type_date ON bdr_sub_entries(sub_type, entry_date);
