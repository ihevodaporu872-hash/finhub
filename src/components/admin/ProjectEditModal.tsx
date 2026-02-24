import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import type { Project, ProjectFormData } from '../../types/projects';

const { TextArea } = Input;

interface Props {
  open: boolean;
  project: Project | null;
  loading: boolean;
  onSave: (data: ProjectFormData) => void;
  onCancel: () => void;
}

export function ProjectEditModal({ open, project, loading, onSave, onCancel }: Props) {
  const [form] = Form.useForm<ProjectFormData>();

  useEffect(() => {
    if (open) {
      if (project) {
        form.setFieldsValue({
          code: project.code,
          name: project.name,
          related_names: project.related_names,
          description: project.description,
          is_active: project.is_active,
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
      onSave(values);
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
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
