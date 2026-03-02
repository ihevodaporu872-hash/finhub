-- Добавление нового типа 'overhead_labor' для строки "Оплата труда ИТР (в т.ч. Налоги с ФОТ)"

ALTER TABLE bdr_sub_entries
  DROP CONSTRAINT IF EXISTS bdr_sub_entries_sub_type_check;

ALTER TABLE bdr_sub_entries
  ADD CONSTRAINT bdr_sub_entries_sub_type_check
    CHECK (sub_type IN ('materials', 'labor', 'subcontract', 'design', 'rental', 'overhead_labor'));
