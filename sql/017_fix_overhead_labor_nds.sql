-- Удаляем записи overhead_labor без привязки к проекту (загружены ошибочно)
DELETE FROM bdr_sub_entries
WHERE sub_type = 'overhead_labor'
  AND project_id IS NULL;

-- Заполняем amount_without_nds для оставшихся записей overhead_labor
UPDATE bdr_sub_entries
SET amount_without_nds = amount
WHERE sub_type = 'overhead_labor'
  AND amount_without_nds IS NULL;
