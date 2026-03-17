-- Делаем "Поступление средств по текущей деятельности" вычисляемой (сумма дочерних)
UPDATE bdds_categories
SET is_calculated = true, calculation_formula = 'sum_children'
WHERE name = 'Поступление средств по текущей деятельности'
  AND section_code = 'operating'
  AND row_type = 'income';

-- Дочерние строки для "Поступление средств по текущей деятельности"
INSERT INTO bdds_categories (section_code, row_type, name, sort_order, is_calculated, parent_id)
SELECT 'operating', 'income', child.name, child.sort_order, false, parent.id
FROM bdds_categories parent,
(VALUES
  ('Поступление от продажи продукции и товаров, выполнения работ, оказания услуг', 1),
  ('Оплата по распред письмам', 2)
) AS child(name, sort_order)
WHERE parent.name = 'Поступление средств по текущей деятельности'
  AND parent.section_code = 'operating'
  AND parent.row_type = 'income';
