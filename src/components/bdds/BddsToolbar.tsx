import { Button, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { YearSelect } from '../common/YearSelect';
import { ProjectSelect } from '../common/ProjectSelect';

interface IProps {
  year: number;
  onYearChange: (year: number) => void;
  onSave: () => void;
  saving: boolean;
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
}

export const BddsToolbar = ({ year, onYearChange, onSave, saving, selectedProjectId, onProjectChange }: IProps) => {
  return (
    <Space className="mb-16" wrap>
      <ProjectSelect value={selectedProjectId} onChange={onProjectChange} />
      <YearSelect value={year} onChange={onYearChange} />
      {selectedProjectId && (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={onSave}
        >
          Сохранить
        </Button>
      )}
    </Space>
  );
};
