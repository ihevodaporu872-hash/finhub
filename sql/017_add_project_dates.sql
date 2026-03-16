-- Даты начала строительства и возврата ГУ для автоподстановки периода на дашбордах
ALTER TABLE projects
  ADD COLUMN start_date DATE,
  ADD COLUMN gu_return_date DATE;
