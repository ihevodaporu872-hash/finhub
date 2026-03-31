import type { FC } from 'react';
import { Card, List, Typography, Tag, Tooltip, Space } from 'antd';
import {
  PieChartOutlined,
  SwapOutlined,
  BankOutlined,
  InsuranceOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { IDossierBdrData, IDossierBddsData } from '../../types/dossier';

const { Text } = Typography;

const fmtAmt = (v: number) =>
  v.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface IConditionItem {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

interface IProps {
  data: IDossierBdrData;
  bdds: IDossierBddsData;
}

export const BdrConditionsBlock: FC<IProps> = ({ data, bdds }) => {
  const conditions: IConditionItem[] = [
    {
      icon: <PieChartOutlined className="dossier-bdr-icon dossier-bdr-icon--blue" />,
      title: 'Распределение экономии',
      description: (
        <>
          <div className="dossier-bdr-row">
            <Tag color="green">Инициатива ГП</Tag>
            <Text>{data.savings_gp_pct}% нам / {data.savings_customer_pct}% Заказчику</Text>
          </div>
          <div className="dossier-bdr-row">
            <Tag color="default">Инициатива Заказчика</Tag>
            <Text>{data.savings_customer_init_gp_pct}% нам / {data.savings_customer_init_pct}% Заказчику</Text>
          </div>
        </>
      ),
    },
    {
      icon: <SwapOutlined className="dossier-bdr-icon dossier-bdr-icon--orange" />,
      title: 'Пересчёт твёрдой цены',
      description: (
        <Text>
          Допускается <Text strong>исключительно</Text> для позиций из{' '}
          <Text strong>{data.price_revision_appendix || 'Приложения'}</Text> при
          изменении рынка более чем на <Text strong>{data.price_revision_threshold_pct}%</Text>.
        </Text>
      ),
    },
  ];

  // Банковские расходы — если указан банк
  if (bdds.preferential_advance_bank) {
    conditions.push({
      icon: <BankOutlined className="dossier-bdr-icon dossier-bdr-icon--purple" />,
      title: 'Комиссии и банковские расходы',
      description: (
        <Text>
          Комиссии за ведение счетов в{' '}
          <Tooltip title="Обязательное требование договора — целевые счета.">
            <Text strong className="dossier-term">{bdds.preferential_advance_bank} <InfoCircleOutlined /></Text>
          </Tooltip>
          ; расходы на выпуск{' '}
          <Tooltip title="Банковская гарантия — инструмент обеспечения обязательств перед заказчиком.">
            <Text strong className="dossier-term">БГ <InfoCircleOutlined /></Text>
          </Tooltip>{' '}
          (на авансы и ГО).
        </Text>
      ),
    });
  }

  // Страхование
  if (data.insurance_go_amount > 0) {
    conditions.push({
      icon: <InsuranceOutlined className="dossier-bdr-icon dossier-bdr-icon--red" />,
      title: 'Страхование',
      description: (
        <Text>
          Полис страхования{' '}
          <Tooltip title="Гражданская ответственность перед третьими лицами в связи со строительными работами.">
            <Text strong className="dossier-term">ГО <InfoCircleOutlined /></Text>
          </Tooltip>{' '}
          на сумму <Text strong>{fmtAmt(data.insurance_go_amount)} ₽</Text>.
        </Text>
      ),
    });
  }

  // OPEX из данных
  for (const item of data.opex_items) {
    conditions.push({
      icon: <SafetyCertificateOutlined className="dossier-bdr-icon dossier-bdr-icon--green" />,
      title: item.title,
      description: <Text>{item.description}</Text>,
    });
  }

  return (
    <Card
      title={
        <Space>
          <PieChartOutlined />
          <span>Блок В: Условия БДР — Рентабельность и затраты</span>
        </Space>
      }
      className="dossier-card"
    >
      <div className="dossier-bdr-subtitle">
        <Text type="secondary">Обязательные OPEX (специфические затраты по договору)</Text>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={conditions}
        renderItem={(item) => (
          <List.Item className="dossier-bdr-list-item">
            <List.Item.Meta
              avatar={item.icon}
              title={<Text strong>{item.title}</Text>}
              description={item.description}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
