-- 031: Добавляем UNIQUE constraint на etl_1c_contract_map
-- Нужен для корректной работы upsert (onConflict)

ALTER TABLE etl_1c_contract_map
  DROP CONSTRAINT IF EXISTS etl_1c_contract_map_counterparty_name_contract_name_key;

ALTER TABLE etl_1c_contract_map
  ADD CONSTRAINT etl_1c_contract_map_counterparty_name_contract_name_key
  UNIQUE (counterparty_name, contract_name);
