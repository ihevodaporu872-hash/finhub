import type { FC } from 'react';
import { Space } from 'antd';
import { YearSelect } from '../common/YearSelect';
import { ProjectSelect } from '../common/ProjectSelect';

interface IProps {
  year: number;
  onYearChange: (year: number) => void;
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
}

export const DashboardToolbar: FC<IProps> = ({ year, onYearChange, selectedProjectId, onProjectChange }) => {
  return (
    <Space className="mb-16" wrap>
      <ProjectSelect value={selectedProjectId} onChange={onProjectChange} />
      <YearSelect value={year} onChange={onYearChange} />
    </Space>
  );
};
