import { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import type { PortalUser, PortalUserFormData } from '../../types/users';

interface Props {
  open: boolean;
  user: PortalUser | null;
  loading: boolean;
  onSave: (data: PortalUserFormData) => void;
  onCancel: () => void;
}

export function UserEditModal({ open, user, loading, onSave, onCancel }: Props) {
  const [form] = Form.useForm<PortalUserFormData>();

  useEffect(() => {
    if (open) {
      if (user) {
        form.setFieldsValue({
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          project: user.project,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, user, form]);

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
      title={user ? 'Редактировать пользователя' : 'Добавить пользователя'}
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
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Введите email' },
            { type: 'email', message: 'Некорректный email' },
          ]}
        >
          <Input placeholder="user@example.com" />
        </Form.Item>
        <Form.Item
          name="full_name"
          label="ФИО"
          rules={[{ required: true, message: 'Введите ФИО' }]}
        >
          <Input placeholder="Иванов Иван Иванович" />
        </Form.Item>
        <Form.Item
          name="role"
          label="Роль"
          rules={[{ required: true, message: 'Введите роль' }]}
        >
          <Input placeholder="Администратор" />
        </Form.Item>
        <Form.Item
          name="project"
          label="Проект"
          rules={[{ required: true, message: 'Введите проект' }]}
        >
          <Input placeholder="Название проекта" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
