-- Финансовое досье договора: базовый договор + дополнительные соглашения
create table if not exists contract_dossiers (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,

  -- Тип документа: 'contract' = базовый договор, 'amendment' = ДС
  document_type text not null default 'contract' check (document_type in ('contract', 'amendment')),
  document_number text not null,         -- "№К14" или "ДС №1"
  document_date date,                     -- Дата документа
  is_active boolean not null default true,

  -- Шапка (Header)
  header_data jsonb not null default '{}'::jsonb,
  -- { contract_name, contract_object, contract_amount, price_type, nds_rate, start_date, end_date, status, duration_months }

  -- Условия БДДС (Блок А)
  bdds_data jsonb not null default '{}'::jsonb,
  -- { advance_payment_days, advance_requires_bg, preferential_advance_pct, preferential_advance_bank,
  --   ks2_submission_day, ks2_acceptance_days, ks2_payment_days,
  --   gu_rate_pct, gu_return_months, gu_bg_replacement, gu_bg_return_days }

  -- Условия БДР (Блок В)
  bdr_data jsonb not null default '{}'::jsonb,
  -- { savings_gp_pct, savings_customer_pct, savings_customer_init_gp_pct, savings_customer_init_pct,
  --   price_revision_threshold_pct, price_revision_appendix,
  --   insurance_go_amount, opex_items: [{title, description}] }

  -- Штрафы и санкции (Блок Г)
  penalties_data jsonb not null default '{}'::jsonb,
  -- { penalties: [{violation, rate, unit}],
  --   customer_penalty_rate_pct, customer_penalty_start_day }

  -- Примечание к ДС (что изменено)
  amendment_summary text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индекс: быстрый доступ по проекту
create index if not exists idx_contract_dossiers_project on contract_dossiers(project_id);

-- RLS
alter table contract_dossiers enable row level security;

create policy "contract_dossiers_select" on contract_dossiers
  for select using (true);

create policy "contract_dossiers_insert" on contract_dossiers
  for insert with check (true);

create policy "contract_dossiers_update" on contract_dossiers
  for update using (true);

create policy "contract_dossiers_delete" on contract_dossiers
  for delete using (true);

-- Заполняем данные для проекта "ЖК PRIMAVERA квартал Bellini. К14"
-- (подставьте реальный project_id)
-- insert into contract_dossiers (project_id, document_type, document_number, document_date, header_data, bdds_data, bdr_data, penalties_data)
-- values (
--   '<project_id>',
--   'contract',
--   '№К14',
--   '2025-05-01',
--   '{"contract_name":"Договор генподряда №К14","contract_object":"ЖК PRIMAVERA квартал Bellini. К14","contract_amount":15800000000,"price_type":"fixed","nds_rate":20,"start_date":"2025-05-01","end_date":"2028-02-01","status":"active","duration_months":33}'::jsonb,
--   '{"advance_payment_days":20,"advance_requires_bg":true,"preferential_advance_pct":10,"preferential_advance_bank":"ВТБ","ks2_submission_day":5,"ks2_acceptance_days":15,"ks2_payment_days":15,"gu_rate_pct":2.5,"gu_return_months":24,"gu_bg_replacement":true,"gu_bg_return_days":10}'::jsonb,
--   '{"savings_gp_pct":20,"savings_customer_pct":80,"savings_customer_init_gp_pct":0,"savings_customer_init_pct":100,"price_revision_threshold_pct":10,"price_revision_appendix":"Приложение №2.1","insurance_go_amount":180000000,"opex_items":[{"title":"Комиссии за ведение счетов","description":"Счета в ВТБ"},{"title":"Выпуск БГ","description":"На авансы и ГО"},{"title":"Страхование ГО","description":"Полис на 180 000 000 ₽"},{"title":"Содержание площадки","description":"Коммуналка, ЧОП, видеонаблюдение, СКУД FaceID"}]}'::jsonb,
--   '{"penalties":[{"violation":"Просрочка промежуточных сроков СМР","rate":200000,"unit":"за каждый день"},{"violation":"Просрочка окончания СМР или получения ЗОС","rate":250000,"unit":"за каждый день"},{"violation":"Просрочка передачи квартир дольщикам","rate":1580000,"unit":"за каждый день"},{"violation":"Задержка устранения дефектов по предписаниям","rate":50000,"unit":"за каждый день"},{"violation":"Смена контроля над ГП без согласования","rate":1000000,"unit":"за каждый случай"}],"customer_penalty_rate_pct":0.05,"customer_penalty_start_day":10}'::jsonb
-- );
