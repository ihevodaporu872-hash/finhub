import { Select } from 'antd';

interface IProps {
  value: number;
  onChange: (year: number) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

export const YearSelect = ({ value, onChange }: IProps) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      className="select-year"
      options={years.map((y) => ({ value: y, label: String(y) }))}
    />
  );
}
