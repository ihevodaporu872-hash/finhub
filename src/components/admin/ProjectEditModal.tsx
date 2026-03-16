import { useEffect } from 'react';
import { Modal, Form, Input, Switch, DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Project, ProjectFormData } from '../../types/projects';

const { TextArea } = Input;

interface IProps {
  open: boolean;
  project: Project | null;
  loading: boolean;
  onSave: (data: ProjectFormData) => void;
  onCancel: () => void;
}

export const ProjectEditModal = ({ open, project, loading, onSave, onCancel }: IProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (project) {
        form.setFieldsValue({
          code: project.code,
          name: project.name,
          related_names: project.related_names,
          description: project.description,
          is_active: project.is_active,
          start_date: project.start_date ? dayjs(project.start_date) : null,
          gu_return_date: project.gu_return_date ? dayjs(project.gu_return_date) : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
    }
  }, [open, project, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formData: ProjectFormData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        gu_return_date: values.gu_return_date ? values.gu_return_date.format('YYYY-MM-DD') : null,
      };
      onSave(formData);
    } catch {
      // validation errors shown by form
    }
  };

  return (
    <Modal
      title={project ? 'Редактировать проект' : 'Добавить проект'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-16">
        <Form.Item
          name="code"
          label="Код"
          rules={[{ required: true, message: 'Введите код проекта' }]}
        >
          <Input placeholder="PRJ-001" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Наименование"
          rules={[{ required: true, message: 'Введите наименование' }]}
        >
          <Input placeholder="Название проекта" />
        </Form.Item>
        <Form.Item
          name="related_names"
          label="Связанные наименования"
        >
          <Input placeholder="Альтернативные названия" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Описание"
        >
          <TextArea rows={3} placeholder="Описание проекта" />
        </Form.Item>
        <Form.Item name="start_date" label="Дата начала строительства">
          <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} placeholder="Выберите дату" />
        </Form.Item>
        <Form.Item name="gu_return_date" label="Дата возврата ГУ">
          <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} placeholder="Выберите дату" />
        </Form.Item>
        <Form.Item
          name="is_active"
          label="Статус"
          valuePropName="checked"
        >
          <Switch checkedChildren="Активен" unCheckedChildren="Не активен" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
