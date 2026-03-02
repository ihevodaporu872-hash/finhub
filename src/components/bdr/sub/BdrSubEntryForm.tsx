import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import type { BdrSubEntry, BdrSubEntryFormData, BdrSubType } from '../../../types/bdr';
import type { Project } from '../../../types/projects';
import dayjs from 'dayjs';

interface IProps {
  visible: boolean;
  subType: BdrSubType;
  projects: Project[];
  editingEntry: BdrSubEntry | null;
  selectedProjectId: string | null;
  selectedMonth: number | null;
  year: number;
  onSave: (data: BdrSubEntryFormData) => Promise<void>;
  onCancel: () => void;
}

export const BdrSubEntryForm = ({
  visible,
  subType,
  projects,
  editingEntry,
  selectedProjectId,
  selectedMonth,
  year,
  onSave,
  onCancel,
}: IProps) => {
  const [form] = Form.useForm();
  const isOverheadLabor = subType === 'overhead_labor';

  const getEntryDate = (): string => {
    const month = selectedMonth ?? new Date().getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}-01`;
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const data: BdrSubEntryFormData = {
      sub_type: subType,
      project_id: values.project_id || null,
      entry_date: isOverheadLabor
        ? getEntryDate()
        : values.entry_date.format('YYYY-MM-DD'),
      company: values.company || '',
      description: isOverheadLabor ? '' : (values.description || ''),
      amount: values.amount || 0,
    };
    await onSave(data);
    form.resetFields();
  };

  const initialValues = editingEntry
    ? {
        project_id: editingEntry.project_id,
        entry_date: isOverheadLabor ? undefined : dayjs(editingEntry.entry_date),
        company: editingEntry.company,
        description: editingEntry.description,
        amount: editingEntry.amount,
      }
    : {
        project_id: selectedProjectId,
        entry_date: isOverheadLabor ? undefined : dayjs(),
      };

  return (
    <Modal
      title={editingEntry ? 'Редактировать запись' : 'Добавить запись'}
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="project_id" label="Проект">
          <Select allowClear placeholder="Выберите проект">
            {projects.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="company"
          label={isOverheadLabor ? 'Отдел/Сотрудник' : 'Фирма'}
        >
          <Input />
        </Form.Item>
        {!isOverheadLabor && (
          <Form.Item
            name="entry_date"
            label="Дата"
            rules={[{ required: true, message: 'Укажите дату' }]}
          >
            <DatePicker format="DD.MM.YYYY" className="w-full" />
          </Form.Item>
        )}
        {!isOverheadLabor && (
          <Form.Item name="description" label="Содержание">
            <Input.TextArea rows={2} />
          </Form.Item>
        )}
        <Form.Item
          name="amount"
          label="Сумма"
          rules={[{ required: true, message: 'Укажите сумму' }]}
        >
          <InputNumber
            className="w-full"
            formatter={(val) => val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
            parser={(val) => val ? Number(val.replace(/\s/g, '')) : 0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
