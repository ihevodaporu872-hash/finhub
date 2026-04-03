-- =============================================================
-- 028: Детализация узлов Инвестиционной и Финансовой деятельности
-- + Расширение доходной части (Субподрядчики — авансы, удержания)
-- Идемпотентная миграция (безопасно перезапускать)
-- =============================================================

-- ==========================================
-- ИНВЕСТИЦИОННАЯ ДЕЯТЕЛЬНОСТЬ — Выбытия
-- ==========================================

-- Родительская строка расходов (если нет)
INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, calculation_formula)
SELECT 'investing', 'expense', 'Выплаты по инвестиционной деятельности', 20, true, 'sum_children'
WHERE NOT EXISTS (
  SELECT 1 FROM bdds_categories
  WHERE name = 'Выплаты по инвестиционной деятельности'
    AND section_code = 'investing' AND row_type = 'expense'
);

-- Дочерние: выбытия (спецтехника, бытовки, краны)
INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, parent_id)
SELECT 'investing', 'expense', child.name, child.sort_order, false, parent.id
FROM bdds_categories parent,
(VALUES
  ('Приобретение ОС (спецтехника, бытовки, краны)', 1)
) AS child(name, sort_order)
WHERE parent.name = 'Выплаты по инвестиционной деятельности'
  AND parent.section_code = 'investing'
  AND parent.row_type = 'expense'
  AND NOT EXISTS (
    SELECT 1 FROM bdds_categories bc
    WHERE bc.name = child.name AND bc.parent_id = parent.id
  );

-- ==========================================
-- ИНВЕСТИЦИОННАЯ ДЕЯТЕЛЬНОСТЬ — Поступления
-- ==========================================

INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, calculation_formula)
SELECT 'investing', 'income', 'Поступления от инвестиционной деятельности', 10, true, 'sum_children'
WHERE NOT EXISTS (
  SELECT 1 FROM bdds_categories
  WHERE name = 'Поступления от инвестиционной деятельности'
    AND section_code = 'investing' AND row_type = 'income'
);

INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, parent_id)
SELECT 'investing', 'income', child.name, child.sort_order, false, parent.id
FROM bdds_categories parent,
(VALUES
  ('Продажа б/у ОС и ТМЦ', 1)
) AS child(name, sort_order)
WHERE parent.name = 'Поступления от инвестиционной деятельности'
  AND parent.section_code = 'investing'
  AND parent.row_type = 'income'
  AND NOT EXISTS (
    SELECT 1 FROM bdds_categories bc
    WHERE bc.name = child.name AND bc.parent_id = parent.id
  );

-- ==========================================
-- ИНВЕСТИЦИОННАЯ ДЕЯТЕЛЬНОСТЬ — ЧДП
-- ==========================================

INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, calculation_formula)
SELECT 'investing', 'net_cash_flow', 'ЧДП от инвестиционной деятельности', 30, true, 'ncf'
WHERE NOT EXISTS (
  SELECT 1 FROM bdds_categories
  WHERE section_code = 'investing' AND row_type = 'net_cash_flow'
);

-- ==========================================
-- ФИНАНСОВАЯ ДЕЯТЕЛЬНОСТЬ — Выбытия
-- ==========================================

INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, calculation_formula)
SELECT 'financing', 'expense', 'Выплаты по финансовой деятельности', 20, true, 'sum_children'
WHERE NOT EXISTS (
  SELECT 1 FROM bdds_categories
  WHERE name = 'Выплаты по финансовой деятельности'
    AND section_code = 'financing' AND row_type = 'expense'
);

INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, parent_id)
SELECT 'financing', 'expense', child.name, child.sort_order, false, parent.id
FROM bdds_categories parent,
(VALUES
  ('Комиссии по Банковским Гарантиям (БГ)', 1),
  ('Лизинговые платежи', 2),
  ('Выплата дивидендов', 3)
) AS child(name, sort_order)
WHERE parent.name = 'Выплаты по финансовой деятельности'
  AND parent.section_code = 'financing'
  AND parent.row_type = 'expense'
  AND NOT EXISTS (
    SELECT 1 FROM bdds_categories bc
    WHERE bc.name = child.name AND bc.parent_id = parent.id
  );

-- ==========================================
-- ФИНАНСОВАЯ ДЕЯТЕЛЬНОСТЬ — ЧДП
-- ==========================================

INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, calculation_formula)
SELECT 'financing', 'net_cash_flow', 'ЧДП от финансовой деятельности', 30, true, 'ncf'
WHERE NOT EXISTS (
  SELECT 1 FROM bdds_categories
  WHERE section_code = 'financing' AND row_type = 'net_cash_flow'
);

-- ==========================================
-- Доходы: авансы субподрядчикам и удержания
-- (дочерние строки расходов по текущей деятельности)
-- ==========================================

INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, parent_id)
SELECT 'operating', 'expense', child.name, child.sort_order, false, parent.id
FROM bdds_categories parent,
(VALUES
  ('Авансы субподрядчикам', 7),
  ('Гарантийные удержания субподрядчикам', 8)
) AS child(name, sort_order)
WHERE parent.name = 'Выплата средств по текущей деятельности'
  AND parent.section_code = 'operating'
  AND parent.row_type = 'expense'
  AND NOT EXISTS (
    SELECT 1 FROM bdds_categories bc
    WHERE bc.name = child.name AND bc.parent_id = parent.id
  );
