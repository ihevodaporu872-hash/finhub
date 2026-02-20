import { useState } from 'react';
import { InputNumber } from 'antd';
import { formatAmount } from '../../utils/formatters';

interface Props {
  value: number | undefined;
  isCalculated?: boolean;
  onSave: (value: number) => void;
}

export function BddsEditableCell({ value, isCalculated, onSave }: Props) {
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
        style={{ width: '100%' }}
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
      style={{ cursor: 'pointer', minHeight: 22, padding: '0 4px' }}
    >
      <span className={value !== undefined && value < 0 ? 'amount-negative' : ''}>
        {display || '\u00A0'}
      </span>
    </div>
  );
}
