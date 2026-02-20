import type { SectionCode } from '../types/bdds';

export const MONTHS = [
  { key: 1, short: 'Янв', full: 'Январь' },
  { key: 2, short: 'Фев', full: 'Февраль' },
  { key: 3, short: 'Мар', full: 'Март' },
  { key: 4, short: 'Апр', full: 'Апрель' },
  { key: 5, short: 'Май', full: 'Май' },
  { key: 6, short: 'Июн', full: 'Июнь' },
  { key: 7, short: 'Июл', full: 'Июль' },
  { key: 8, short: 'Авг', full: 'Август' },
  { key: 9, short: 'Сен', full: 'Сентябрь' },
  { key: 10, short: 'Окт', full: 'Октябрь' },
  { key: 11, short: 'Ноя', full: 'Ноябрь' },
  { key: 12, short: 'Дек', full: 'Декабрь' },
];

export const SECTION_NAMES: Record<SectionCode, string> = {
  operating: 'Основная деятельность',
  investing: 'Инвестиционная деятельность',
  financing: 'Финансовая деятельность',
};

export const SECTION_ORDER: SectionCode[] = ['operating', 'investing', 'financing'];
