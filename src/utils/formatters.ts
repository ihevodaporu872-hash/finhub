export function formatAmount(value: number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return '';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function parseAmount(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
