-- Удаляем все записи без привязки к проекту (загружены ошибочно)
DELETE FROM bdr_sub_entries
WHERE project_id IS NULL;

-- Заполняем amount_without_nds для записей где оно пустое
UPDATE bdr_sub_entries
SET amount_without_nds = amount
WHERE amount_without_nds IS NULL;
