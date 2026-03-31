-- ББЛ (Бюджет по Балансовому Листу) — управленческий баланс
-- Хранит plan/fact значения по строкам баланса помесячно

create table if not exists bbl_entries (
  id uuid default gen_random_uuid() primary key,
  row_code text not null,
  year int not null,
  month int not null check (month between 1 and 12),
  amount numeric not null default 0,
  entry_type text not null check (entry_type in ('plan', 'fact')),
  project_id uuid references projects(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Уникальность: одна запись на строку/год/месяц/тип (без проекта)
create unique index if not exists bbl_entries_uniq
  on bbl_entries (row_code, year, month, entry_type)
  where project_id is null;

-- Уникальность: одна запись на строку/год/месяц/тип/проект
create unique index if not exists bbl_entries_uniq_project
  on bbl_entries (row_code, year, month, entry_type, project_id)
  where project_id is not null;

-- Индекс для быстрого доступа по году
create index if not exists idx_bbl_entries_year on bbl_entries(year);

-- RLS
alter table bbl_entries enable row level security;

create policy "bbl_entries_select" on bbl_entries for select using (true);
create policy "bbl_entries_insert" on bbl_entries for insert with check (true);
create policy "bbl_entries_update" on bbl_entries for update using (true);
create policy "bbl_entries_delete" on bbl_entries for delete using (true);
