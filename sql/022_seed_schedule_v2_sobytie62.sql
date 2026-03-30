-- Сид данных для Плановый график 2.0: ЖК "Событие 6.2"
-- Договор подряда № ПД-00573007 от 12.01.2026

-- 1. Создаём проект (если не существует)
INSERT INTO projects (code, name, related_names, description, is_active, start_date, gu_return_date)
VALUES (
  'SOB-62',
  'ЖК «Событие 6.2»',
  'Событие 6.2, Событие, СУ-10, ДС СТРОЙ',
  'Многофункциональная комплексная жилая застройка, г. Москва, ЗАО, район Раменки. Договор подряда № ПД-00573007 от 12.01.2026. Генподрядчик ООО «СУ-10».',
  true,
  '2026-01-12',
  '2028-09-22'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  related_names = EXCLUDED.related_names,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  gu_return_date = EXCLUDED.gu_return_date;

-- 2. Заполняем категории расчёта стоимости (Расчет стоимости строительных работ, Часть 1)
DO $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT id INTO v_project_id FROM projects WHERE code = 'SOB-62';

  -- Прямые затраты (из Приложения 2.1 — Расчёт стоимости строительных работ, Часть 1)
  INSERT INTO schedule_v2_categories (project_id, name, cost_group, sort_order, volume, unit, price_per_unit, cost_materials, cost_labor, cost_sub_materials, cost_sub_labor, total)
  VALUES
    (v_project_id, 'Организация строительной площадки', 'direct', 1, 0, '', 0, 12649811, 11107262.18, 20847954.08, 47175120.19, 91780148.45),
    (v_project_id, 'Земляные работы', 'direct', 2, 0, '', 0, 0, 0, 32105.16, 4980699.8, 5012804.96),
    (v_project_id, 'Водоотведение и водопонижение', 'direct', 3, 0, '', 0, 0, 0, 1290380, 4289980, 5580360),
    (v_project_id, 'Устройство котлована', 'direct', 4, 0, '', 0, 123210.71, 16134876, 19574894.63, 9674279.88, 45507261.22),
    (v_project_id, 'Гидроизоляционные работы', 'direct', 5, 0, '', 0, 70720988.24, 18971378.52, 0, 1608720, 91301086.76),
    (v_project_id, 'Устройство виброзащиты', 'direct', 6, 0, '', 0, 44792342.71, 865282.1, 0, 0, 45657624.81),
    (v_project_id, 'Монолитные работы', 'direct', 7, 76663, 'м3', 0, 5369146.61, 14154024.93, 1161012259.66, 1241476597.91, 2422012029.11),
    (v_project_id, 'Металлические конструкции', 'direct', 8, 0, '', 0, 22526747.61, 7762656, 28284124.08, 13028400, 71601927.69),
    (v_project_id, 'Кладочные работы', 'direct', 9, 0, '', 0, 8556311.77, 135000, 95484149.94, 155298776.9, 259474238.61),
    (v_project_id, 'Кровля', 'direct', 10, 0, '', 0, 102411129.65, 4608748.09, 253.05, 91733231.44, 198753362.23),
    (v_project_id, 'Фасадные работы', 'direct', 11, 0, '', 0, 13504206.4, 13110880, 1576385212.92, 1593088163.81, 3196088463.13),
    (v_project_id, 'Отделочные работы', 'direct', 12, 76663, 'м2', 0, 304428648.3, 243013911.11, 140257389.43, 49789579.29, 737489528.13),
    (v_project_id, 'Мокап', 'direct', 13, 0, '', 0, 9963396.27, 7363671.25, 15738244.37, 4409657.83, 37474969.72),
    (v_project_id, 'Двери, люки, ворота', 'direct', 14, 0, '', 0, 0, 8276000, 191191883.86, 19973368.04, 219441251.9),
    (v_project_id, 'ВИС / Механические инженерные системы', 'direct', 15, 76219.99, 'м2', 0, 0, 0, 657329020.23, 720326750.87, 1377655771.1),
    (v_project_id, 'ВИС / Электрические системы', 'direct', 16, 0, '', 0, 421458476.54, 92989933.69, 15309044.65, 10535589.8, 540293044.68),
    (v_project_id, 'ВИС / Слаботочные системы, автоматика и диспетчеризация', 'direct', 17, 0, '', 0, 262811369.76, 128268399.41, 5665000, 1500000, 398244769.17),
    (v_project_id, 'Технология (ТХ)', 'direct', 18, 0, '', 0, 39541313.7, 3054899, 159996128.15, 80860000, 283452340.85),
    (v_project_id, 'Наружные ВИС / Механические инженерные системы', 'direct', 19, 0, '', 0, 0, 0, 4562298.84, 3662756.93, 8225055.77),
    (v_project_id, 'Благоустройство', 'direct', 20, 0, '', 0, 40147541.81, 10409631.52, 148558037.49, 58575574.25, 257690785.07),
    (v_project_id, 'Отделка квартир MR BASE (предчистовая отделка)', 'direct', 21, 0, '', 0, 5659365.43, 2663072.4, 8189018.41, 2244434.49, 18755890.73)
  ON CONFLICT (project_id, name, cost_group) DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    volume = EXCLUDED.volume,
    unit = EXCLUDED.unit,
    price_per_unit = EXCLUDED.price_per_unit,
    cost_materials = EXCLUDED.cost_materials,
    cost_labor = EXCLUDED.cost_labor,
    cost_sub_materials = EXCLUDED.cost_sub_materials,
    cost_sub_labor = EXCLUDED.cost_sub_labor,
    total = EXCLUDED.total,
    updated_at = NOW();

  -- Коммерческие затраты (из Приложения 2.2 — Расчёт стоимости строительных работ, Часть 2 + накладные)
  -- Те же категории, но с коммерческой составляющей
  INSERT INTO schedule_v2_categories (project_id, name, cost_group, sort_order, volume, unit, price_per_unit, cost_materials, cost_labor, cost_sub_materials, cost_sub_labor, total)
  VALUES
    (v_project_id, 'Организация строительной площадки', 'commercial', 1, 0, '', 0, 11610040.62, 41014609.51, 20756906.08, 62382323.78, 135763879.99),
    (v_project_id, 'Земляные работы', 'commercial', 2, 0, '', 0, 0, 0, 32105.16, 6094650.33, 6126755.49),
    (v_project_id, 'Водоотведение и водопонижение', 'commercial', 3, 0, '', 0, 0, 0, 1290380, 5530053.18, 6820433.18),
    (v_project_id, 'Устройство котлована', 'commercial', 4, 0, '', 0, 0, 46496907.19, 18734145.46, 17014809.86, 82245862.50),
    (v_project_id, 'Гидроизоляционные работы', 'commercial', 5, 0, '', 0, 63979413.55, 106490094.88, 0, 1966211.37, 172435719.80),
    (v_project_id, 'Устройство виброзащиты', 'commercial', 6, 0, '', 0, 43692203.42, 32283978.33, 0, 0, 75976181.75),
    (v_project_id, 'Монолитные работы', 'commercial', 7, 76663, 'м3', 0, 1962646.20, 47458055.92, 802956591.72, 2133415742.27, 2985793036.10),
    (v_project_id, 'Металлические конструкции', 'commercial', 8, 0, '', 0, 22015815.63, 37218053.64, 27620706.73, 22872327.76, 109726903.77),
    (v_project_id, 'Кладочные работы', 'commercial', 9, 0, '', 0, 8362037.27, 6064163.53, 80150694.64, 226361464.99, 320938360.43),
    (v_project_id, 'Кровля', 'commercial', 10, 0, '', 0, 94885077.61, 86370587.96, 0, 112118591.15, 293374256.71),
    (v_project_id, 'Фасадные работы', 'commercial', 11, 0, '', 0, 0, 26615086.40, 1471550254.49, 2789626357.49, 4287791698.38),
    (v_project_id, 'Отделочные работы', 'commercial', 12, 76663, 'м2', 18944, 293513013.09, 903245310.56, 140257389.43, 115249946.34, 1452265659.42),
    (v_project_id, 'Мокап', 'commercial', 13, 0, '', 0, 9905179.07, 27570464.92, 15683928.38, 11403779.71, 64563352.08),
    (v_project_id, 'Двери, люки, ворота', 'commercial', 14, 0, '', 0, 0, 23745787.34, 189354210.35, 94545455.53, 307645453.22),
    (v_project_id, 'ВИС / Механические инженерные системы', 'commercial', 15, 76219.99, 'м2', 24300, 0, 0, 653937020.23, 1198242775.40, 1852179795.63),
    (v_project_id, 'ВИС / Электрические системы', 'commercial', 16, 0, '', 0, 421458476.54, 536863688.76, 15309044.65, 19437595.81, 993068805.76),
    (v_project_id, 'ВИС / Слаботочные системы, автоматика и диспетчеризация', 'commercial', 17, 0, '', 0, 175495849.85, 478402364.39, 5665000, 3967934.81, 663531149.05),
    (v_project_id, 'Технология (ТХ)', 'commercial', 18, 0, '', 0, 38951643.76, 34691384.68, 153714863.94, 170102495.64, 397460388.02),
    (v_project_id, 'Наружные ВИС / Механические инженерные системы', 'commercial', 19, 0, '', 0, 0, 0, 4562298.84, 5490537.05, 10052835.89),
    (v_project_id, 'Благоустройство', 'commercial', 20, 0, '', 0, 39378448.44, 56361709.45, 148558037.49, 129921317.59, 374219512.97),
    (v_project_id, 'Отделка квартир MR BASE (предчистовая отделка)', 'commercial', 21, 0, '', 0, 5659365.43, 11267275.04, 8047716.39, 5979467.37, 30953824.23)
  ON CONFLICT (project_id, name, cost_group) DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    volume = EXCLUDED.volume,
    unit = EXCLUDED.unit,
    price_per_unit = EXCLUDED.price_per_unit,
    cost_materials = EXCLUDED.cost_materials,
    cost_labor = EXCLUDED.cost_labor,
    cost_sub_materials = EXCLUDED.cost_sub_materials,
    cost_sub_labor = EXCLUDED.cost_sub_labor,
    total = EXCLUDED.total,
    updated_at = NOW();

  -- 3. Помесячное распределение прямых затрат
  -- Распределение по категориям на основе графика строительных работ (Приложение 3)
  -- и графика авансирования (Приложение 4)
  -- Период: январь 2026 — сентябрь 2028

  -- Удаляем старые помесячные данные для этого проекта
  DELETE FROM schedule_v2_monthly WHERE project_id = v_project_id;

  -- Вставляем помесячные данные (равномерное распределение по периодам выполнения работ)
  INSERT INTO schedule_v2_monthly (project_id, category_id, month_key, amount)
  SELECT v_project_id, c.id, m.mk,
    c.total / m.cnt
  FROM schedule_v2_categories c
  CROSS JOIN LATERAL (
    SELECT mk, COUNT(*) OVER () as cnt
    FROM (
      SELECT to_char(d, 'YYYY-MM') as mk
      FROM generate_series(
        CASE c.name
          WHEN 'Организация строительной площадки' THEN '2026-01-01'::date
          WHEN 'Земляные работы' THEN '2026-02-01'::date
          WHEN 'Водоотведение и водопонижение' THEN '2026-01-01'::date
          WHEN 'Устройство котлована' THEN '2026-03-01'::date
          WHEN 'Гидроизоляционные работы' THEN '2026-06-01'::date
          WHEN 'Устройство виброзащиты' THEN '2026-05-01'::date
          WHEN 'Монолитные работы' THEN '2026-04-01'::date
          WHEN 'Металлические конструкции' THEN '2026-07-01'::date
          WHEN 'Кладочные работы' THEN '2026-08-01'::date
          WHEN 'Кровля' THEN '2027-01-01'::date
          WHEN 'Фасадные работы' THEN '2026-09-01'::date
          WHEN 'Отделочные работы' THEN '2027-01-01'::date
          WHEN 'Мокап' THEN '2026-06-01'::date
          WHEN 'Двери, люки, ворота' THEN '2027-03-01'::date
          WHEN 'ВИС / Механические инженерные системы' THEN '2026-10-01'::date
          WHEN 'ВИС / Электрические системы' THEN '2026-10-01'::date
          WHEN 'ВИС / Слаботочные системы, автоматика и диспетчеризация' THEN '2027-01-01'::date
          WHEN 'Технология (ТХ)' THEN '2027-01-01'::date
          WHEN 'Наружные ВИС / Механические инженерные системы' THEN '2027-04-01'::date
          WHEN 'Благоустройство' THEN '2028-03-01'::date
          WHEN 'Отделка квартир MR BASE (предчистовая отделка)' THEN '2027-06-01'::date
          -- Коммерческие
          WHEN 'Проектные работы' THEN '2026-01-01'::date
          WHEN 'Генподрядные услуги (12% от 2чЦСР)' THEN '2026-06-01'::date
          WHEN 'Прочие коммерческие расходы' THEN '2026-01-01'::date
          ELSE '2026-01-01'::date
        END,
        CASE c.name
          WHEN 'Организация строительной площадки' THEN '2026-06-01'::date
          WHEN 'Земляные работы' THEN '2026-05-01'::date
          WHEN 'Водоотведение и водопонижение' THEN '2028-06-01'::date
          WHEN 'Устройство котлована' THEN '2026-08-01'::date
          WHEN 'Гидроизоляционные работы' THEN '2026-12-01'::date
          WHEN 'Устройство виброзащиты' THEN '2026-10-01'::date
          WHEN 'Монолитные работы' THEN '2027-06-01'::date
          WHEN 'Металлические конструкции' THEN '2026-12-01'::date
          WHEN 'Кладочные работы' THEN '2027-03-01'::date
          WHEN 'Кровля' THEN '2027-06-01'::date
          WHEN 'Фасадные работы' THEN '2028-03-01'::date
          WHEN 'Отделочные работы' THEN '2028-06-01'::date
          WHEN 'Мокап' THEN '2026-09-01'::date
          WHEN 'Двери, люки, ворота' THEN '2027-12-01'::date
          WHEN 'ВИС / Механические инженерные системы' THEN '2028-06-01'::date
          WHEN 'ВИС / Электрические системы' THEN '2028-06-01'::date
          WHEN 'ВИС / Слаботочные системы, автоматика и диспетчеризация' THEN '2028-06-01'::date
          WHEN 'Технология (ТХ)' THEN '2028-03-01'::date
          WHEN 'Наружные ВИС / Механические инженерные системы' THEN '2027-09-01'::date
          WHEN 'Благоустройство' THEN '2028-09-01'::date
          WHEN 'Отделка квартир MR BASE (предчистовая отделка)' THEN '2028-03-01'::date
          -- Коммерческие
          WHEN 'Проектные работы' THEN '2026-08-01'::date
          WHEN 'Генподрядные услуги (12% от 2чЦСР)' THEN '2028-09-01'::date
          WHEN 'Прочие коммерческие расходы' THEN '2028-09-01'::date
          ELSE '2028-09-01'::date
        END,
        '1 month'::interval
      ) d
    ) months
  ) m
  WHERE c.project_id = v_project_id
    AND c.total > 0;

  -- 4. Финансовые строки
  DELETE FROM schedule_v2_finance WHERE project_id = v_project_id;

  -- Аванс (Приход) — по графику авансирования (Приложение 4)
  INSERT INTO schedule_v2_finance (project_id, row_code, month_key, amount)
  VALUES
    -- Авансы на материалы по графику авансирования
    (v_project_id, 'advance_income', '2026-01', 69847694.10),
    (v_project_id, 'advance_income', '2026-02', 341003015.42),
    (v_project_id, 'advance_income', '2026-03', 114799021.06),
    (v_project_id, 'advance_income', '2026-04', 129991032.10),
    (v_project_id, 'advance_income', '2026-05', 132122032.62),
    (v_project_id, 'advance_income', '2026-06', 199764451.52),
    (v_project_id, 'advance_income', '2026-07', 258765759.84),
    (v_project_id, 'advance_income', '2026-08', 284813924.88),
    (v_project_id, 'advance_income', '2026-09', 371906018.57),
    (v_project_id, 'advance_income', '2026-10', 393393664.82),
    (v_project_id, 'advance_income', '2026-11', 252835917.12),
    (v_project_id, 'advance_income', '2026-12', 205936348.62),
    (v_project_id, 'advance_income', '2027-01', 254647819.01),
    (v_project_id, 'advance_income', '2027-02', 305894360.21),
    (v_project_id, 'advance_income', '2027-03', 263829042.52),
    (v_project_id, 'advance_income', '2027-04', 169804830.12),
    (v_project_id, 'advance_income', '2027-05', 200758746.91),
    (v_project_id, 'advance_income', '2027-06', 166310454.03),
    (v_project_id, 'advance_income', '2027-07', 106310454.03),
    (v_project_id, 'advance_income', '2027-08', 14838727.21),
    (v_project_id, 'advance_income', '2027-09', 16026999.99);

  -- Гарантийное удержание — 5% от СМР каждого месяца (стандарт ДС СТРОЙ)
  INSERT INTO schedule_v2_finance (project_id, row_code, month_key, amount)
  SELECT v_project_id, 'guarantee_retention', m.month_key,
    ROUND(SUM(m.amount) * 0.05, 2)
  FROM schedule_v2_monthly m
  WHERE m.project_id = v_project_id
  GROUP BY m.month_key
  HAVING SUM(m.amount) > 0;

  -- Зачет аванса — пропорционально выполнению (% от аванса = % выполнения)
  INSERT INTO schedule_v2_finance (project_id, row_code, month_key, amount)
  SELECT v_project_id, 'advance_offset', m.month_key,
    ROUND(SUM(m.amount) * 0.30, 2)  -- ~30% зачёт (пропорция аванс/общая стоимость)
  FROM schedule_v2_monthly m
  WHERE m.project_id = v_project_id
  GROUP BY m.month_key
  HAVING SUM(m.amount) > 0;

  -- Возврат ГУ — через 24 месяца после окончания работ
  INSERT INTO schedule_v2_finance (project_id, row_code, month_key, amount)
  SELECT v_project_id, 'guarantee_return', '2030-09',
    ROUND(SUM(amount), 2)
  FROM schedule_v2_finance
  WHERE project_id = v_project_id AND row_code = 'guarantee_retention';

END $$;
