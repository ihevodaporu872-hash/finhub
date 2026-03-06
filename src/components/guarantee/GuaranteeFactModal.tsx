import { useEffect } from 'react';
import type { FC } from 'react';
import { Modal, Form, InputNumber, DatePicker, Input } from 'antd';
import dayjs from 'dayjs';
import type { GuaranteeFactFormData } from '../../types/guarantee';

interface IProps {
  open: boolean;
  projectId: string;
  projectName: string;
  monthKey: string;
  planAmount: number;
  initialData?: { fact_amount: number; fact_date: string | null; note: string };
  onSave: (data: GuaranteeFactFormData) => Promise<void>;
  onCancel: () => void;
}

export const GuaranteeFactModal: FC<IProps> = ({
  open,
  projectId,
  projectName,
  monthKey,
  planAmount,
  initialData,
  onSave,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        fact_amount: initialData?.fact_amount ?? 0,
        fact_date: initialData?.fact_date ? dayjs(initialData.fact_date) : null,
        note: initialData?.note ?? '',
      });
    }
  }, [open, initialData, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave({
      project_id: projectId,
      month_key: monthKey,
      fact_amount: values.fact_amount,
      fact_date: values.fact_date ? values.fact_date.format('YYYY-MM-DD') : null,
      note: values.note || '',
    });
  };

  const [year, month] = monthKey.split('-');
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <Modal
      title={`Факт возврата ГУ — ${projectName}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnClose
    >
      <p className="guarantee-modal-subtitle">
        Период: {monthName} | План: {planAmount.toLocaleString('ru-RU')} руб.
      </p>
      <Form form={form} layout="vertical">
        <Form.Item
          name="fact_amount"
          label="Фактическая сумма возврата"
          rules={[{ required: true, message: 'Введите сумму' }]}
        >
          <InputNumber
            className="guarantee-input-amount"
            min={0}
            precision={2}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            parser={(value) => (Number(value?.replace(/\s/g, '') ?? 0)) as 0}
          />
        </Form.Item>
        <Form.Item name="fact_date" label="Дата возврата">
          <DatePicker format="DD.MM.YYYY" className="guarantee-input-date" />
        </Form.Item>
        <Form.Item name="note" label="Комментарий">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
