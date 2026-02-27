-- =============================================
-- Миграция 005: Создание пользователя Федянов А.А.
-- =============================================

-- Шаг 1: Создать пользователя в Supabase Auth
-- Выполнить в Supabase Dashboard → Authentication → Users → Add User:
--   Email: fedianov.a.a@su10.ru
--   Password: FinHubSU10FA

-- Шаг 2: Добавить в portal_users (выполнить после шага 1)
INSERT INTO portal_users (email, full_name, role, project, registered_at)
VALUES (
  'fedianov.a.a@su10.ru',
  'Федянов Александр Александрович',
  '',
  '',
  now()
);
