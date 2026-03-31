/**
 * Маппинг категорий Плановый график 2.0 → work_type_code из БДДС/БДР.
 * Несколько категорий Schedule V2 могут агрегироваться в один work_type_code.
 */

const CATEGORY_TO_WORK_TYPE: Record<string, string> = {
  'Организация строительной площадки': 'prep_works',
  'Земляные работы': 'earthworks',
  'Водоотведение и водопонижение': 'dewatering',
  'Устройство котлована': 'earthworks',
  'Гидроизоляционные работы': 'waterproofing',
  'Устройство виброзащиты': 'prep_works',
  'Монолитные работы': 'monolith',
  'Металлические конструкции': 'monolith',
  'Кладочные работы': 'masonry',
  'Кровля': 'roofing',
  'Фасадные работы': 'facade',
  'Отделочные работы': 'interior',
  'Мокап': 'interior',
  'Двери, люки, ворота': 'interior',
  'ВИС / Механические инженерные системы': 'engineering',
  'ВИС / Электрические системы': 'engineering',
  'ВИС / Слаботочные системы, автоматика и диспетчеризация': 'engineering',
  'Технология (ТХ)': 'engineering',
  'Наружные ВИС / Механические инженерные системы': 'external_networks',
  'Благоустройство': 'landscaping',
  'Отделка квартир MR BASE (предчистовая отделка)': 'interior',
};

export function getCategoryWorkType(categoryName: string): string | null {
  return CATEGORY_TO_WORK_TYPE[categoryName] ?? null;
}
