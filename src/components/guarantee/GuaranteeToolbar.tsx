import type { FC } from 'react';
import { Space, Select } from 'antd';
import { YearSelect } from '../common/YearSelect';
import type { Project } from '../../types/projects';
import type { GuaranteeStatus } from '../../types/guarantee';

interface IProps {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  statusFilter: GuaranteeStatus | 'all';
  onStatusChange: (status: GuaranteeStatus | 'all') => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'overdue', label: 'Просрочен' },
  { value: 'partial', label: 'Частично' },
  { value: 'returned', label: 'Возвращён' },
];

export const GuaranteeToolbar: FC<IProps> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  selectedYear,
  onYearChange,
  statusFilter,
  onStatusChange,
}) => {
  const projectOptions = [
    { value: '__all__', label: 'Все проекты' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <Space wrap className="guarantee-toolbar">
      <Select
        value={selectedProjectId ?? '__all__'}
        onChange={(val) => onProjectChange(val === '__all__' ? null : val)}
        options={projectOptions}
        className="select-project"
        placeholder="Выберите проект"
      />
      <YearSelect value={selectedYear} onChange={onYearChange} />
      <Select
        value={statusFilter}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        className="guarantee-status-select"
      />
    </Space>
  );
};
