import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import type { BdrSubEntry, BdrSubEntryFormData, BdrSubType } from '../../../types/bdr';
import type { Project } from '../../../types/projects';
import dayjs from 'dayjs';

interface Props {
  visible: boolean;
  subType: BdrSubType;
  projects: Project[];
  editingEntry: BdrSubEntry | null;
  selectedProjectId: string | null;
  onSave: (data: BdrSubEntryFormData) => Promise<void>;
  onCancel: () => void;
}

export const BdrSubEntryForm = ({ visible, subType, projects, editingEntry, selectedProjectId, onSave, onCancel }: Props) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    const data: BdrSubEntryFormData = {
      sub_type: subType,
      project_id: values.project_id || null,
      entry_date: values.entry_date.format('YYYY-MM-DD'),
      company: values.company || '',
      description: values.description || '',
      amount: values.amount || 0,
    };
    await onSave(data);
    form.resetFields();
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
      <Form
        form={form}
        layout="vertical"
        initialValues={
          editingEntry
            ? {
                project_id: editingEntry.project_id,
                entry_date: dayjs(editingEntry.entry_date),
                company: editingEntry.company,
                description: editingEntry.description,
                amount: editingEntry.amount,
              }
            : {
                project_id: selectedProjectId,
                entry_date: dayjs(),
              }
        }
      >
        <Form.Item name="project_id" label="Проект">
          <Select allowClear placeholder="Выберите проект">
            {projects.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="company" label="Фирма">
          <Input />
        </Form.Item>
        <Form.Item
          name="entry_date"
          label="Дата"
          rules={[{ required: true, message: 'Укажите дату' }]}
        >
          <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label="Содержание">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="amount"
          label="Сумма"
          rules={[{ required: true, message: 'Укажите сумму' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={(val) => val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
            parser={(val) => val ? Number(val.replace(/\s/g, '')) : 0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
