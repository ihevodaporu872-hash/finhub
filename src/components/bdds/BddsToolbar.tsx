import { Button, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { YearSelect } from '../common/YearSelect';

interface Props {
  year: number;
  onYearChange: (year: number) => void;
  onSave: () => void;
  saving: boolean;
}

export function BddsToolbar({ year, onYearChange, onSave, saving }: Props) {
  return (
    <Space style={{ marginBottom: 16 }}>
      <YearSelect value={year} onChange={onYearChange} />
      <Button
        type="primary"
        icon={<SaveOutlined />}
        loading={saving}
        onClick={onSave}
      >
        Сохранить
      </Button>
    </Space>
  );
}
