export interface IDefaultCategory {
  name: string;
  costGroup: 'commercial' | 'direct';
  sortOrder: number;
}

export const DEFAULT_CATEGORIES: IDefaultCategory[] = [
  // Прямые затраты
  { name: 'Организация строительной площадки', costGroup: 'direct', sortOrder: 1 },
  { name: 'Земляные работы', costGroup: 'direct', sortOrder: 2 },
  { name: 'Водоотведение и водопонижение', costGroup: 'direct', sortOrder: 3 },
  { name: 'Устройство котлована', costGroup: 'direct', sortOrder: 4 },
  { name: 'Гидроизоляционные работы', costGroup: 'direct', sortOrder: 5 },
  { name: 'Устройство виброзащиты', costGroup: 'direct', sortOrder: 6 },
  { name: 'Монолитные работы', costGroup: 'direct', sortOrder: 7 },
  { name: 'Металлические конструкции', costGroup: 'direct', sortOrder: 8 },
  { name: 'Кладочные работы', costGroup: 'direct', sortOrder: 9 },
  { name: 'Кровля', costGroup: 'direct', sortOrder: 10 },
  { name: 'Фасадные работы', costGroup: 'direct', sortOrder: 11 },
  { name: 'Отделочные работы', costGroup: 'direct', sortOrder: 12 },
  { name: 'Мокап', costGroup: 'direct', sortOrder: 13 },
  { name: 'Двери, люки, ворота', costGroup: 'direct', sortOrder: 14 },
  { name: 'ВИС / Механические инженерные системы', costGroup: 'direct', sortOrder: 15 },
  { name: 'ВИС / Электрические системы', costGroup: 'direct', sortOrder: 16 },
  { name: 'ВИС / Слаботочные системы, автоматика и диспетчеризация', costGroup: 'direct', sortOrder: 17 },
  { name: 'Технология (ТХ)', costGroup: 'direct', sortOrder: 18 },
  { name: 'Наружные ВИС / Механические инженерные системы', costGroup: 'direct', sortOrder: 19 },
  { name: 'Благоустройство', costGroup: 'direct', sortOrder: 20 },
  { name: 'Отделка квартир MR BASE (предчистовая отделка)', costGroup: 'direct', sortOrder: 21 },
  // Коммерческие затраты
  { name: 'Проектные работы', costGroup: 'commercial', sortOrder: 1 },
  { name: 'Генподрядные услуги', costGroup: 'commercial', sortOrder: 2 },
  { name: 'Страхование', costGroup: 'commercial', sortOrder: 3 },
  { name: 'Банковская гарантия', costGroup: 'commercial', sortOrder: 4 },
  { name: 'Прочие коммерческие расходы', costGroup: 'commercial', sortOrder: 5 },
];

export const COST_GROUP_LABELS: Record<string, string> = {
  direct: 'Прямые затраты',
  commercial: 'Коммерческие затраты',
};
