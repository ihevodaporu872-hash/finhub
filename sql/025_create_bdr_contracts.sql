-- Модуль Договоры: управление контрактами с субподрядчиками
-- Soft Commit — мягкое резервирование бюджета при заведении договора

CREATE TABLE IF NOT EXISTS bdr_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bdr_sub_type TEXT NOT NULL,                   -- статья БДР (subcontract, materials и т.д.)
  contract_number TEXT NOT NULL,                 -- номер договора
  contractor_name TEXT NOT NULL,                 -- наименование контрагента
  subject TEXT,                                  -- предмет договора
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,       -- сумма договора
  amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0,  -- оплачено фактически
  status TEXT NOT NULL DEFAULT 'draft'           -- draft | active | completed | cancelled
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  sign_date DATE,                                -- дата подписания
  start_date DATE,                               -- дата начала работ
  end_date DATE,                                 -- дата окончания работ
  overlimit_approved BOOLEAN DEFAULT FALSE,      -- согласование сверхлимита
  overlimit_approved_by UUID REFERENCES portal_users(id),
  overlimit_approved_at TIMESTAMPTZ,
  note TEXT,
  created_by UUID REFERENCES portal_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_bdr_contracts_project ON bdr_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_bdr_contracts_status ON bdr_contracts(status);
CREATE INDEX IF NOT EXISTS idx_bdr_contracts_sub_type ON bdr_contracts(bdr_sub_type);
CREATE INDEX IF NOT EXISTS idx_bdr_contracts_project_type ON bdr_contracts(project_id, bdr_sub_type, status);

-- RLS
ALTER TABLE bdr_contracts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bdr_contracts' AND policyname = 'bdr_contracts_all'
  ) THEN
    CREATE POLICY "bdr_contracts_all" ON bdr_contracts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
