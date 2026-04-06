-- 035: Справочник расчётных счетов + привязка к etl_1c_entries

-- Справочник расчётных счетов
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT NOT NULL UNIQUE,
  bank_name TEXT NOT NULL DEFAULT '',
  bik TEXT NOT NULL DEFAULT '',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Привязка проводки к расчётному счёту
ALTER TABLE etl_1c_entries
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id);

CREATE INDEX IF NOT EXISTS idx_etl_entries_bank_account ON etl_1c_entries(bank_account_id);

-- RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_accounts_all" ON bank_accounts
  FOR ALL USING (TRUE) WITH CHECK (TRUE);
