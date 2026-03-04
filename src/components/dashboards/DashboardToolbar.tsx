import type { FC } from 'react';
import { Space, Typography } from 'antd';
import { YearSelect } from '../common/YearSelect';
import { ProjectSelect } from '../common/ProjectSelect';

interface IProps {
  yearFrom: number;
  yearTo: number;
  onYearFromChange: (year: number) => void;
  onYearToChange: (year: number) => void;
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
}

export const DashboardToolbar: FC<IProps> = ({
  yearFrom, yearTo, onYearFromChange, onYearToChange,
  selectedProjectId, onProjectChange,
}) => {
  return (
    <Space className="mb-16" wrap>
      <ProjectSelect value={selectedProjectId} onChange={onProjectChange} />
      <Typography.Text>с</Typography.Text>
      <YearSelect value={yearFrom} onChange={onYearFromChange} />
      <Typography.Text>по</Typography.Text>
      <YearSelect value={yearTo} onChange={onYearToChange} />
    </Space>
  );
};
