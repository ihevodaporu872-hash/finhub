import { Button, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { YearSelect } from '../common/YearSelect';

interface IProps {
  year: number;
  onYearChange: (year: number) => void;
  onSave: () => void;
  saving: boolean;
}

export const BdrToolbar = ({ year, onYearChange, onSave, saving }: IProps) => {
  return (
    <Space className="mb-16">
      <YearSelect value={year} onChange={onYearChange} />
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={onSave}
        loading={saving}
      >
        Сохранить
      </Button>
    </Space>
  );
};
