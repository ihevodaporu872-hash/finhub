-- RPC-функции для агрегации БДР данных (обход лимита 1000 строк Supabase)

-- 1. Итого СМР за все годы (знаменатель % готовности)
CREATE OR REPLACE FUNCTION bdr_smr_all_years_total(p_project_id UUID DEFAULT NULL)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(
    amount * 100.0 / CASE WHEN LEFT(month_key,4)::int >= 2026 THEN 122 ELSE 120 END
  ), 0)
  FROM bdds_income_entries
  WHERE work_type_code IN (
    'prep_works','dewatering','earthworks','waterproofing',
    'monolith','masonry','facade','roofing','interior',
    'elevators','engineering','landscaping','external_networks'
  )
  AND (p_project_id IS NULL OR project_id = p_project_id);
$$ LANGUAGE sql STABLE;

-- 2. Кумулятивная выручка до указанного года
CREATE OR REPLACE FUNCTION bdr_revenue_cumulative_before(
  p_year INT,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE(plan_total NUMERIC, fact_total NUMERIC) AS $$
  SELECT
    COALESCE((
      SELECT SUM(amount * 100.0 / CASE WHEN LEFT(month_key,4)::int >= 2026 THEN 122 ELSE 120 END)
      FROM bdds_income_entries
      WHERE work_type_code IN (
        'prep_works','dewatering','earthworks','waterproofing',
        'monolith','masonry','facade','roofing','interior',
        'elevators','engineering','landscaping','external_networks'
      )
      AND month_key < (p_year || '-01')
      AND (p_project_id IS NULL OR project_id = p_project_id)
    ), 0) AS plan_total,
    COALESCE((
      SELECT SUM(ks_amount * 100.0 / CASE WHEN LEFT(month_key,4)::int >= 2026 THEN 122 ELSE 120 END)
      FROM actual_execution_entries
      WHERE month_key < (p_year || '-01')
      AND (p_project_id IS NULL OR project_id = p_project_id)
    ), 0) AS fact_total;
$$ LANGUAGE sql STABLE;

-- 3. Помесячные итоги СМР за год
CREATE OR REPLACE FUNCTION bdr_smr_totals_by_month(
  p_year INT,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE(month INT, without_vat NUMERIC, with_vat NUMERIC) AS $$
  SELECT
    LEFT(month_key, 7)::TEXT AS mk,
    SUBSTRING(month_key FROM 6 FOR 2)::INT AS month,
    SUM(amount * 100.0 / CASE WHEN p_year >= 2026 THEN 122 ELSE 120 END) AS without_vat,
    SUM(amount) AS with_vat
  FROM bdds_income_entries
  WHERE month_key LIKE (p_year || '-%')
  AND work_type_code IN (
    'prep_works','dewatering','earthworks','waterproofing',
    'monolith','masonry','facade','roofing','interior',
    'elevators','engineering','landscaping','external_networks'
  )
  AND (p_project_id IS NULL OR project_id = p_project_id)
  GROUP BY mk, month
  ORDER BY month;
$$ LANGUAGE sql STABLE;
