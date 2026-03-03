-- Добавление project_id в bdr_entries и bdds_entries
-- для поддержки данных по проектам

-- 1. bdr_entries: добавить project_id
ALTER TABLE bdr_entries ADD COLUMN project_id UUID REFERENCES projects(id);

-- Удалить старый unique constraint
ALTER TABLE bdr_entries DROP CONSTRAINT IF EXISTS bdr_entries_row_code_year_month_entry_type_key;

-- Partial unique index для строк с project_id
CREATE UNIQUE INDEX bdr_entries_unique_with_project
  ON bdr_entries (row_code, year, month, entry_type, project_id)
  WHERE project_id IS NOT NULL;

-- Partial unique index для legacy строк без project_id
CREATE UNIQUE INDEX bdr_entries_unique_without_project
  ON bdr_entries (row_code, year, month, entry_type)
  WHERE project_id IS NULL;

-- 2. bdds_entries: добавить project_id
ALTER TABLE bdds_entries ADD COLUMN project_id UUID REFERENCES projects(id);

-- Удалить старый unique constraint
ALTER TABLE bdds_entries DROP CONSTRAINT IF EXISTS bdds_entries_category_id_year_month_entry_type_key;

-- Partial unique index для строк с project_id
CREATE UNIQUE INDEX bdds_entries_unique_with_project
  ON bdds_entries (category_id, year, month, entry_type, project_id)
  WHERE project_id IS NOT NULL;

-- Partial unique index для legacy строк без project_id
CREATE UNIQUE INDEX bdds_entries_unique_without_project
  ON bdds_entries (category_id, year, month, entry_type)
  WHERE project_id IS NULL;
