import { Space, Segmented } from 'antd';
import { YearSelect } from '../../common/YearSelect';

interface IProps {
  costGroup: 'direct' | 'commercial';
  onCostGroupChange: (group: 'direct' | 'commercial') => void;
  yearFrom: number;
  yearTo: number;
  onYearFromChange: (year: number) => void;
  onYearToChange: (year: number) => void;
}

export const ScheduleV2Toolbar = ({
  costGroup,
  onCostGroupChange,
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
}: IProps) => {
  return (
    <div className="bdds-income-toolbar">
      <Space wrap size="middle">
        <span>Тип затрат:</span>
        <Segmented
          value={costGroup}
          onChange={(val) => onCostGroupChange(val as 'direct' | 'commercial')}
          options={[
            { label: 'Прямые затраты', value: 'direct' },
            { label: 'Коммерческие затраты', value: 'commercial' },
          ]}
        />
        <span>Год с</span>
        <YearSelect value={yearFrom} onChange={onYearFromChange} />
        <span>Год по</span>
        <YearSelect value={yearTo} onChange={onYearToChange} />
      </Space>
    </div>
  );
};
