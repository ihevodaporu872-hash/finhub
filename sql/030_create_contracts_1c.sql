-- Модуль «Управление контрактами 1С»
-- Импорт договоров из 1С, обогащение, контроль лимитов БДР

CREATE TABLE IF NOT EXISTS contracts_1c (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Поля из 1С (импорт Excel)
  guid_1c TEXT NOT NULL UNIQUE,
  inn TEXT,
  counterparty_name TEXT NOT NULL,
  contract_number TEXT NOT NULL,
  contract_date DATE,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB',
  contract_type TEXT NOT NULL DEFAULT 'supplier'
    CHECK (contract_type IN ('supplier', 'buyer')),

  -- Статус карточки
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'active', 'overlimit', 'amount_changed')),

  -- Ручное обогащение (Блок 3)
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  bdr_sub_type TEXT,
  advance_percent NUMERIC(5,2),
  guarantee_percent NUMERIC(5,2),
  gencontract_percent NUMERIC(5,2),
  account_type TEXT CHECK (account_type IN ('regular', 'target_obs')),

  -- Трекинг изменений суммы
  prev_amount NUMERIC(15,2),

  -- Метаданные импорта
  import_batch_id UUID,
  imported_at TIMESTAMPTZ DEFAULT now(),
  enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_contracts_1c_guid ON contracts_1c(guid_1c);
CREATE INDEX IF NOT EXISTS idx_contracts_1c_status ON contracts_1c(status);
CREATE INDEX IF NOT EXISTS idx_contracts_1c_project ON contracts_1c(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_1c_bdr ON contracts_1c(bdr_sub_type);
CREATE INDEX IF NOT EXISTS idx_contracts_1c_batch ON contracts_1c(import_batch_id);

-- RLS
ALTER TABLE contracts_1c ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts_1c' AND policyname = 'contracts_1c_all'
  ) THEN
    CREATE POLICY "contracts_1c_all" ON contracts_1c FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- RPC: массовый UPSERT с защитой ручных полей
CREATE OR REPLACE FUNCTION contracts_1c_upsert_batch(
  p_batch_id UUID,
  p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_row JSONB;
  v_inserted INT := 0;
  v_updated INT := 0;
  v_amount_changed INT := 0;
  v_existing RECORD;
BEGIN
  FOR v_row IN SELECT jsonb_array_elements(p_rows) LOOP
    -- Ищем существующий по GUID
    SELECT id, amount, status INTO v_existing
    FROM contracts_1c
    WHERE guid_1c = v_row->>'guid_1c';

    IF v_existing.id IS NULL THEN
      -- INSERT: новая карточка
      INSERT INTO contracts_1c (
        guid_1c, inn, counterparty_name, contract_number,
        contract_date, amount, currency, contract_type,
        status, import_batch_id, imported_at
      ) VALUES (
        v_row->>'guid_1c',
        v_row->>'inn',
        v_row->>'counterparty_name',
        v_row->>'contract_number',
        (v_row->>'contract_date')::DATE,
        (v_row->>'amount')::NUMERIC,
        COALESCE(v_row->>'currency', 'RUB'),
        COALESCE(v_row->>'contract_type', 'supplier'),
        'new',
        p_batch_id,
        now()
      );
      v_inserted := v_inserted + 1;
    ELSE
      -- UPDATE: обновляем только поля из 1С, НЕ трогаем ручные
      UPDATE contracts_1c SET
        inn = v_row->>'inn',
        counterparty_name = v_row->>'counterparty_name',
        contract_number = v_row->>'contract_number',
        contract_date = (v_row->>'contract_date')::DATE,
        currency = COALESCE(v_row->>'currency', 'RUB'),
        contract_type = COALESCE(v_row->>'contract_type', 'supplier'),
        import_batch_id = p_batch_id,
        imported_at = now(),
        updated_at = now(),
        -- Если сумма изменилась — сохраняем prev_amount и меняем статус
        prev_amount = CASE
          WHEN (v_row->>'amount')::NUMERIC != v_existing.amount
          THEN v_existing.amount
          ELSE prev_amount
        END,
        amount = (v_row->>'amount')::NUMERIC,
        status = CASE
          WHEN (v_row->>'amount')::NUMERIC != v_existing.amount
            AND v_existing.status = 'active'
          THEN 'amount_changed'
          ELSE status
        END
      WHERE id = v_existing.id;

      IF (v_row->>'amount')::NUMERIC != v_existing.amount THEN
        v_amount_changed := v_amount_changed + 1;
      END IF;
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'amount_changed', v_amount_changed
  );
END;
$$;
