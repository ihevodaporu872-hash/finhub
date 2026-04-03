import { useState, useCallback } from 'react';
import { Card, Table, Button, Select, DatePicker, Form, InputNumber, Input, Modal, Progress, Alert, Popconfirm, message, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useKs6a } from '../../hooks/useKs6a';
import type { IKs6aEntry, IKs6aFormData } from '../../types/ks6a';
import { KS6A_STAGES } from '../../types/ks6a';
import { useProjects } from '../../hooks/useProjects';
import { formatAmount } from '../../utils/formatters';

export const Ks6aPage = () => {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm();

  const { entries, loading, saving, save, remove } = useKs6a(selectedProjectId);

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    const data: IKs6aFormData = {
      project_id: selectedProjectId!,
      entry_date: values.entry_date.format('YYYY-MM-DD'),
      stage_code: values.stage_code,
      stage_name: KS6A_STAGES.find((s) => s.code === values.stage_code)?.name || values.stage_code,
      readiness_percent: values.readiness_percent,
      volume_done: values.volume_done,
      volume_unit: values.volume_unit,
      note: values.note,
    };
    await save(data);
    form.resetFields();
    setFormVisible(false);
    message.success('Запись сохранена');
  }, [form, save, selectedProjectId]);

  // Сводка по этапам (последний % по каждому)
  const stageSummary = (() => {
    const map = new Map<string, IKs6aEntry>();
    for (const entry of entries) {
      if (!map.has(entry.stage_code)) {
        map.set(entry.stage_code, entry);
      }
    }
    return [...map.values()];
  })();

  const avgReadiness = stageSummary.length
    ? stageSummary.reduce((sum, s) => sum + Number(s.readiness_percent), 0) / stageSummary.length
    : 0;

  const columns: ColumnsType<IKs6aEntry> = [
    { title: 'Дата', dataIndex: 'entry_date', width: 110, render: (v: string) => dayjs(v).format('DD.MM.YYYY') },
    { title: 'Этап', dataIndex: 'stage_name', width: 200 },
    {
      title: '% готовности',
      dataIndex: 'readiness_percent',
      width: 130,
      render: (v: number) => <Progress percent={Number(v)} size="small" />,
    },
    {
      title: 'Объём',
      width: 120,
      render: (_: unknown, r: IKs6aEntry) =>
        r.volume_done ? `${formatAmount(r.volume_done)} ${r.volume_unit || ''}` : '—',
    },
    { title: 'Примечание', dataIndex: 'note', ellipsis: true },
    {
      title: '',
      width: 50,
      render: (_: unknown, r: IKs6aEntry) => (
        <Popconfirm title="Удалить запись?" onConfirm={() => remove(r.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Card title="Трекер КС-6а — Физическая готовность объекта" className="mt-16">
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
              Добавить запись
            </Button>
          </Col>
        </Row>

        {selectedProjectId && stageSummary.length > 0 && (
          <Row gutter={[12, 12]} className="mb-16">
            <Col xs={24} sm={8} md={6}>
              <Card size="small" className="bdr-kpi-dash-card" style={{ borderLeft: '3px solid #1677ff', background: '#f0f5ff' }}>
                <div className="bdr-kpi-dash-value" style={{ color: '#1677ff' }}>
                  {avgReadiness.toFixed(1)}%
                </div>
                <div className="bdr-kpi-dash-title">Средняя готовность</div>
              </Card>
            </Col>
            {stageSummary.slice(0, 4).map((s) => (
              <Col xs={12} sm={8} md={4} key={s.stage_code}>
                <Card size="small" style={{ borderLeft: '3px solid #52c41a', background: '#f6ffed' }}>
                  <Progress percent={Number(s.readiness_percent)} size="small" />
                  <div style={{ fontSize: 11, color: '#595959' }}>{s.stage_name}</div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!selectedProjectId && (
          <Alert message="Выберите проект для просмотра журнала готовности" type="info" showIcon />
        )}

        {selectedProjectId && (
          <Table<IKs6aEntry>
            columns={columns}
            dataSource={entries}
            loading={loading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
          />
        )}
      </Card>

      <Modal
        title="Внести % готовности"
        open={formVisible}
        onOk={handleSave}
        onCancel={() => { form.resetFields(); setFormVisible(false); }}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="entry_date"
            label="Дата"
            rules={[{ required: true, message: 'Укажите дату' }]}
            initialValue={dayjs()}
          >
            <DatePicker format="DD.MM.YYYY" className="w-full" />
          </Form.Item>
          <Form.Item
            name="stage_code"
            label="Этап"
            rules={[{ required: true, message: 'Выберите этап' }]}
          >
            <Select placeholder="Выберите этап">
              {KS6A_STAGES.map((s) => (
                <Select.Option key={s.code} value={s.code}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="readiness_percent"
            label="% физической готовности"
            rules={[{ required: true, message: 'Укажите процент' }]}
          >
            <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
          </Form.Item>
          <Form.Item name="volume_done" label="Объём выполненных работ">
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="volume_unit" label="Единица измерения">
            <Input placeholder="м3, м2, шт..." />
          </Form.Item>
          <Form.Item name="note" label="Примечание">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
