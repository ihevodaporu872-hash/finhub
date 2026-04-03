-- Удаление дубликата проекта "Событие 6.2" (с обычными кавычками)
-- Оставляем только ЖК «Событие 6.2» (с ёлочками, код SOB-62)
DO $$
DECLARE
  v_dup_id UUID;
BEGIN
  SELECT id INTO v_dup_id FROM projects
  WHERE name = 'ЖК "Событие 6.2"'
    AND code IS DISTINCT FROM 'SOB-62';

  IF v_dup_id IS NULL THEN
    RAISE NOTICE 'Дубликат не найден';
    RETURN;
  END IF;

  DELETE FROM actual_execution_entries WHERE project_id = v_dup_id;
  DELETE FROM bdds_income_entries WHERE project_id = v_dup_id;
  DELETE FROM bdds_income_notes WHERE project_id = v_dup_id;
  DELETE FROM bdds_entries WHERE project_id = v_dup_id;
  DELETE FROM bdr_entries WHERE project_id = v_dup_id;
  DELETE FROM bdr_sub_entries WHERE project_id = v_dup_id;
  DELETE FROM bdds_receipt_details WHERE project_id = v_dup_id;
  DELETE FROM guarantee_facts WHERE project_id = v_dup_id;
  DELETE FROM schedule_v2_monthly WHERE project_id = v_dup_id;
  DELETE FROM schedule_v2_finance WHERE project_id = v_dup_id;
  DELETE FROM schedule_v2_categories WHERE project_id = v_dup_id;
  DELETE FROM projects WHERE id = v_dup_id;

  RAISE NOTICE 'Дубликат удалён: %', v_dup_id;
END $$;
