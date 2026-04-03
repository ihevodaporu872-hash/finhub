import { useState, useCallback } from 'react';
import { Card, Table, Button, Select, Form, Input, InputNumber, DatePicker, Modal, Tag, Alert, Popconfirm, message, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useContracts } from '../../hooks/useContracts';
import { useProjects } from '../../hooks/useProjects';
import type { IBdrContract, IBdrContractFormData } from '../../types/contracts';
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, CONTRACT_BDR_TYPES } from '../../types/contracts';
import { formatAmount } from '../../utils/formatters';

export const ContractsPage = () => {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm();

  const { contracts, loading, saving, create, remove } = useContracts(selectedProjectId);

  const handleCreate = useCallback(async () => {
    const values = await form.validateFields();
    const data: IBdrContractFormData = {
      project_id: selectedProjectId!,
      bdr_sub_type: values.bdr_sub_type,
      contract_number: values.contract_number,
      contractor_name: values.contractor_name,
      subject: values.subject,
      amount: values.amount,
      sign_date: values.sign_date?.format('YYYY-MM-DD'),
      start_date: values.start_date?.format('YYYY-MM-DD'),
      end_date: values.end_date?.format('YYYY-MM-DD'),
      note: values.note,
    };

    const result = await create(data);
    if (result.success) {
      form.resetFields();
      setFormVisible(false);
      message.success('Договор создан, бюджет зарезервирован');
    } else {
      Modal.confirm({
        title: 'Превышен лимит бюджета',
        icon: <ExclamationCircleOutlined />,
        content: result.budgetMessage,
        okText: 'Запросить согласование сверхлимита',
        cancelText: 'Отмена',
        onOk: () => {
          message.info('Запрос на согласование сверхлимита отправлен');
        },
      });
    }
  }, [form, create, selectedProjectId]);

  // Статистика
  const totalAmount = contracts.filter((c) => c.status === 'active').reduce((s, c) => s + Number(c.amount), 0);
  const totalPaid = contracts.filter((c) => c.status === 'active').reduce((s, c) => s + Number(c.amount_paid), 0);

  const columns: ColumnsType<IBdrContract> = [
    { title: '№ договора', dataIndex: 'contract_number', width: 130 },
    { title: 'Контрагент', dataIndex: 'contractor_name', width: 180, ellipsis: true },
    {
      title: 'Статья БДР',
      dataIndex: 'bdr_sub_type',
      width: 140,
      render: (v: string) => CONTRACT_BDR_TYPES.find((t) => t.value === v)?.label || v,
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (v: number) => formatAmount(v),
    },
    {
      title: 'Оплачено',
      dataIndex: 'amount_paid',
      width: 120,
      align: 'right',
      render: (v: number) => formatAmount(v),
    },
    {
      title: 'Остаток',
      width: 120,
      align: 'right',
      render: (_: unknown, r: IBdrContract) => formatAmount(Number(r.amount) - Number(r.amount_paid)),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 110,
      render: (v: keyof typeof CONTRACT_STATUS_LABELS) => (
        <Tag color={CONTRACT_STATUS_COLORS[v]}>{CONTRACT_STATUS_LABELS[v]}</Tag>
      ),
    },
    {
      title: 'Дата',
      dataIndex: 'sign_date',
      width: 100,
      render: (v: string | null) => v ? dayjs(v).format('DD.MM.YYYY') : '—',
    },
    {
      title: '',
      width: 50,
      render: (_: unknown, r: IBdrContract) => (
        <Popconfirm title="Удалить договор?" onConfirm={() => remove(r.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Card title="Договоры — управление контрактами с субподрядчиками" className="mt-16">
        <Row gutter={16} className="mb-16">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Выберите проект"
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              allowClear
              className="w-full"
            >
              {projects.map((p) => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!selectedProjectId}
              onClick={() => setFormVisible(true)}
            >
              Новый договор
            </Button>
          </Col>
        </Row>

        {selectedProjectId && contracts.length > 0 && (
          <Row gutter={[12, 12]} className="mb-16">
            <Col xs={12} sm={8} md={6}>
              <Card size="small" style={{ borderLeft: '3px solid #1677ff', background: '#f0f5ff' }}>
                <div className="bdr-kpi-dash-value" style={{ color: '#1677ff' }}>
                  {formatAmount(totalAmount)}
                </div>
                <div className="bdr-kpi-dash-title">Общая сумма (активные)</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small" style={{ borderLeft: '3px solid #52c41a', background: '#f6ffed' }}>
                <div className="bdr-kpi-dash-value" style={{ color: '#52c41a' }}>
                  {formatAmount(totalPaid)}
                </div>
                <div className="bdr-kpi-dash-title">Оплачено</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small" style={{ borderLeft: '3px solid #fa8c16', background: '#fff7e6' }}>
                <div className="bdr-kpi-dash-value" style={{ color: '#fa8c16' }}>
                  {formatAmount(totalAmount - totalPaid)}
                </div>
                <div className="bdr-kpi-dash-title">Резерв (Soft Commit)</div>
              </Card>
            </Col>
          </Row>
        )}

        {!selectedProjectId && (
          <Alert message="Выберите проект для управления договорами" type="info" showIcon />
        )}

        {selectedProjectId && (
          <Table<IBdrContract>
            columns={columns}
            dataSource={contracts}
            loading={loading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      <Modal
        title="Новый договор"
        open={formVisible}
        onOk={handleCreate}
        onCancel={() => { form.resetFields(); setFormVisible(false); }}
        confirmLoading={saving}
        okText="Создать и зарезервировать бюджет"
        cancelText="Отмена"
        width={600}
        destroyOnHidden
      >
        <Alert
          type="info"
          message="При создании договора сумма будет зарезервирована (Soft Commit) по выбранной статье БДР"
          showIcon
          className="mb-12"
        />
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contract_number" label="№ договора" rules={[{ required: true, message: 'Обязательное поле' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bdr_sub_type" label="Статья БДР" rules={[{ required: true, message: 'Выберите статью' }]}>
                <Select placeholder="Статья расходов">
                  {CONTRACT_BDR_TYPES.map((t) => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="contractor_name" label="Контрагент" rules={[{ required: true, message: 'Обязательное поле' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subject" label="Предмет договора">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="amount" label="Сумма договора" rules={[{ required: true, message: 'Укажите сумму' }]}>
            <InputNumber
              className="w-full"
              formatter={(val) => val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
              parser={(val) => val ? Number(val.replace(/\s/g, '')) : 0}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sign_date" label="Дата подписания">
                <DatePicker format="DD.MM.YYYY" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="start_date" label="Дата начала">
                <DatePicker format="DD.MM.YYYY" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="end_date" label="Дата окончания">
                <DatePicker format="DD.MM.YYYY" className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="Примечание">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
