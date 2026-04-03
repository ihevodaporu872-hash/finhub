export interface IKs6aEntry {
  id: string;
  project_id: string;
  entry_date: string;
  stage_code: string;
  stage_name: string;
  readiness_percent: number;
  volume_done: number | null;
  volume_unit: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IKs6aFormData {
  project_id: string;
  entry_date: string;
  stage_code: string;
  stage_name: string;
  readiness_percent: number;
  volume_done?: number;
  volume_unit?: string;
  note?: string;
}

/** Этапы строительства для выбора в форме */
export const KS6A_STAGES = [
  { code: 'prep_works', name: 'Подготовительные работы' },
  { code: 'earthworks', name: 'Земляные работы' },
  { code: 'dewatering', name: 'Водопонижение' },
  { code: 'waterproofing', name: 'Гидроизоляция' },
  { code: 'monolith', name: 'Монолитные работы' },
  { code: 'masonry', name: 'Кладочные работы' },
  { code: 'facade', name: 'Фасадные работы' },
  { code: 'roofing', name: 'Кровельные работы' },
  { code: 'interior', name: 'Внутренняя отделка' },
  { code: 'elevators', name: 'Лифты' },
  { code: 'engineering', name: 'Инженерные системы' },
  { code: 'landscaping', name: 'Благоустройство' },
  { code: 'external_networks', name: 'Наружные сети' },
] as const;
