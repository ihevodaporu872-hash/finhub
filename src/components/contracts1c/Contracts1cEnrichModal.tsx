import { useEffect, type FC } from 'react';
import { Modal, Form, Select, InputNumber, Alert } from 'antd';
import type { IContract1c, IContract1cEnrichData, AccountType } from '../../types/contracts1c';
import { ACCOUNT_TYPE_LABELS } from '../../types/contracts1c';
import { CONTRACT_BDR_TYPES } from '../../types/contracts';
import type { Project } from '../../types/projects';
import { formatAmount } from '../../utils/formatters';

interface IContracts1cEnrichModalProps {
  contract: IContract1c | null;
  projects: Project[];
  open: boolean;
  saving: boolean;
  onSave: (id: string, data: IContract1cEnrichData) => void;
  onCancel: () => void;
}

export const Contracts1cEnrichModal: FC<IContracts1cEnrichModalProps> = ({
  contract,
  projects,
  open,
  saving,
  onSave,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (contract && open) {
      form.setFieldsValue({
        project_id: contract.project_id || undefined,
        bdr_sub_type: contract.bdr_sub_type || undefined,
        advance_percent: contract.advance_percent,
        guarantee_percent: contract.guarantee_percent,
        gencontract_percent: contract.gencontract_percent,
        account_type: contract.account_type || undefined,
      });
    }
  }, [contract, open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    if (contract) {
      onSave(contract.id, values as IContract1cEnrichData);
    }
  };

  if (!contract) return null;

  return (
    <Modal
      title="Обогащение договора"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={saving}
      okText="Активировать договор"
      cancelText="Отмена"
      width={520}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        className="mb-12"
        message={
          <>
            <strong>{contract.contract_number}</strong> — {contract.counterparty_name}
            <br />
            Сумма: <strong>{formatAmount(contract.amount)}</strong>
          </>
        }
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="project_id"
          label="Проект (ЖК)"
          rules={[{ required: true, message: 'Выберите проект' }]}
        >
          <Select placeholder="Выберите ЖК">
            {projects.filter(p => p.is_active).map(p => (
              <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="bdr_sub_type"
          label="Статья БДР"
          rules={[{ required: true, message: 'Выберите статью' }]}
        >
          <Select placeholder="Привязка к лимиту">
            {CONTRACT_BDR_TYPES.map(t => (
              <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="advance_percent" label="% Аванса">
          <InputNumber min={0} max={100} addonAfter="%" className="w-full" />
        </Form.Item>

        <Form.Item name="guarantee_percent" label="% Гарантийного удержания">
          <InputNumber min={0} max={100} addonAfter="%" className="w-full" />
        </Form.Item>

        <Form.Item name="gencontract_percent" label="% Генподрядных услуг">
          <InputNumber min={0} max={100} addonAfter="%" className="w-full" />
        </Form.Item>

        <Form.Item name="account_type" label="Тип счёта">
          <Select placeholder="Тип расчётного счёта" allowClear>
            {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([value, label]) => (
              <Select.Option key={value} value={value}>{label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
