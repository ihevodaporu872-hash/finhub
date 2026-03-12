-- Добавляем колонки Сумма НДС и Сумма без НДС в bdr_sub_entries
ALTER TABLE bdr_sub_entries
  ADD COLUMN IF NOT EXISTS amount_nds NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_without_nds NUMERIC(15,2) DEFAULT 0;
