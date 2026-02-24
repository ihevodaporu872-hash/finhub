-- =============================================
-- Миграция 002: Таблица пользователей портала
-- =============================================

CREATE TABLE portal_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  project TEXT NOT NULL DEFAULT '',
  registered_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portal_users_email ON portal_users(email);
CREATE INDEX idx_portal_users_is_active ON portal_users(is_active);
