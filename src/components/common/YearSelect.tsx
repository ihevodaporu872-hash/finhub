import { Select } from 'antd';

interface Props {
  value: number;
  onChange: (year: number) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

export function YearSelect({ value, onChange }: Props) {
  return (
    <Select
      value={value}
      onChange={onChange}
      style={{ width: 100 }}
      options={years.map((y) => ({ value: y, label: String(y) }))}
    />
  );
}
