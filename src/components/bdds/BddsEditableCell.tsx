import { useState } from 'react';
import { InputNumber } from 'antd';
import { formatAmount } from '../../utils/formatters';

interface IProps {
  value: number | undefined;
  isCalculated?: boolean;
  onSave: (value: number) => void;
}

export const BddsEditableCell = ({ value, isCalculated, onSave }: IProps) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState<number | null>(value ?? null);

  if (isCalculated) {
    const display = formatAmount(value);
    return (
      <span className={value !== undefined && value < 0 ? 'amount-negative' : ''}>
        {display}
      </span>
    );
  }

  if (editing) {
    return (
      <InputNumber
        autoFocus
        value={inputValue}
        onChange={(val) => setInputValue(val)}
        onPressEnter={() => {
          setEditing(false);
          onSave(inputValue ?? 0);
        }}
        onBlur={() => {
          setEditing(false);
          onSave(inputValue ?? 0);
        }}
        size="small"
        className="w-full"
        controls={false}
        formatter={(val) => val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
        parser={(val) => val ? Number(val.replace(/\s/g, '')) : 0}
      />
    );
  }

  const display = formatAmount(value);

  return (
    <div
      onClick={() => {
        setInputValue(value ?? null);
        setEditing(true);
      }}
      className="editable-cell-view"
    >
      <span className={value !== undefined && value < 0 ? 'amount-negative' : ''}>
        {display || '\u00A0'}
      </span>
    </div>
  );
}
