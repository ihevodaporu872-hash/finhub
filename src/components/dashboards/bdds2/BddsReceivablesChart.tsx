import { type FC, useMemo, useRef } from 'react';
import { Card, Tooltip, Statistic, Row, Col } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { DualAxes } from '@ant-design/charts';
import type { IReceivablesPoint } from '../../../hooks/useReceivablesData';
import { ShareChartButton } from '../../common/ShareChartButton';

interface IProps {
  data: IReceivablesPoint[];
}

const HELP_TEXT = `Дебиторская задолженность — разница между подписанными актами КС-2 и фактическими поступлениями.

• Синяя линия: Накопительный итог подписанных актов КС-2 (выручка по документам).
• Зелёная линия: Накопительный итог поступлений от заказчика.
• Серая часть столбца: Гарантийные удержания (5% от КС-2) — законный долг, пока не подлежит взысканию.
• Красная часть столбца: Проблемная дебиторка — деньги, которые заказчик задерживает.

Рост красных столбцов — сигнал к действию для коммерческого отдела.`;

const formatMln = (v: number): string =>
  (v / 1_000_000).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const axisFormatter = (v: number): string => {
  const mln = v / 1_000_000;
  return mln % 1 === 0 ? mln.toFixed(0) : mln.toFixed(1);
};

const LEGEND_ITEMS = [
  { color: '#1890ff', label: 'КС-2 (нараст.)', isLine: true },
  { color: '#52c41a', label: 'Поступления (нараст.)', isLine: true },
  { color: '#d9d9d9', label: 'Гарантийные удержания', isRect: true },
  { color: '#ff4d4f', label: 'К взысканию', isRect: true },
];

export const BddsReceivablesChart: FC<IProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  // KPI — последний месяц
  const kpi = useMemo(() => {
    const last = data[data.length - 1];
    if (!last) return { ks: 0, receipts: 0, totalDebt: 0, problemDebt: 0, guaranteeRetention: 0 };
    return {
      ks: last.cumKs,
      receipts: last.cumReceipts,
      totalDebt: last.totalDebt,
      problemDebt: last.problemDebt,
      guaranteeRetention: last.guaranteeRetention,
    };
  }, [data]);

  // Данные для графика
  const { lineData, stackedColumns } = useMemo(() => {
    const lineData: Array<{ month: string; value: number; type: string }> = [];
    const stackedColumns: Array<{ month: string; value: number; type: string }> = [];

    for (const pt of data) {
      lineData.push({ month: pt.month, value: pt.cumKs, type: 'КС-2' });
      lineData.push({ month: pt.month, value: pt.cumReceipts, type: 'Поступления' });

      stackedColumns.push({ month: pt.month, value: pt.guaranteeRetention, type: 'Гарант. удержания' });
      stackedColumns.push({ month: pt.month, value: pt.problemDebt, type: 'К взысканию' });
    }

    return { lineData, stackedColumns };
  }, [data]);

  // Tooltip map
  const tooltipMap = useMemo(() => {
    const map = new Map<string, IReceivablesPoint>();
    for (const pt of data) map.set(pt.month, pt);
    return map;
  }, [data]);

  // Синхронизация нуля для двух осей
  const { rightDomainMax } = useMemo(() => {
    let maxDebt = 0;
    for (const pt of data) {
      if (pt.totalDebt > maxDebt) maxDebt = pt.totalDebt;
    }
    return { rightDomainMax: maxDebt * 1.2 || 1 };
  }, [data]);

  const config = {
    xField: 'month',
    interaction: {
      tooltip: {
        render: (_: unknown, { items }: { items: Array<{ value: unknown }> }) => {
          const firstItem = items[0] as { data?: Record<string, unknown> };
          const monthKey = (firstItem?.data?.month as string) || '';
          const info = tooltipMap.get(monthKey);
          if (!info) return '';
          return `<div style="padding:4px 0;font-size:13px;line-height:1.6">
            <div style="font-weight:600;margin-bottom:4px">${info.month}</div>
            <div>Накоплено КС-2: <b>${formatMln(info.cumKs)} млн</b></div>
            <div>Поступило: <b>${formatMln(info.cumReceipts)} млн</b></div>
            <div style="border-top:1px solid #f0f0f0;margin-top:4px;padding-top:4px">
              Дебиторка: <b style="color:#ff4d4f">${formatMln(info.totalDebt)} млн</b>
            </div>
            <div style="padding-left:8px;font-size:12px">
              в т.ч. Гарант. удержания: ${formatMln(info.guaranteeRetention)} млн
            </div>
            <div style="padding-left:8px;font-size:12px">
              К оплате: <span style="color:#ff4d4f;font-weight:600">${formatMln(info.problemDebt)} млн</span>
            </div>
          </div>`;
        },
      },
    },
    children: [
      // Stacked столбцы дебиторки (правая ось)
      {
        data: stackedColumns,
        type: 'interval' as const,
        yField: 'value',
        colorField: 'type',
        stack: true,
        scale: {
          color: {
            domain: ['Гарант. удержания', 'К взысканию'],
            range: ['#d9d9d9', '#ff4d4f'],
          },
          y: {
            domainMin: 0,
            domainMax: rightDomainMax,
          },
        },
        style: {
          fillOpacity: 0.7,
          maxWidth: 24,
        },
        axis: {
          x: {
            title: false,
            labelAutoRotate: false,
            labelAutoHide: true,
            labelAutoEllipsis: true,
          },
          y: {
            position: 'right' as const,
            title: 'Дебиторка (млн руб.)',
            titleFontSize: 11,
            labelFormatter: axisFormatter,
          },
        },
        legend: false,
        tooltip: {
          items: [
            (d: Record<string, number | string>) => ({
              name: String(d.type),
              value: formatMln(Number(d.value)) + ' млн',
              color: d.type === 'К взысканию' ? '#ff4d4f' : '#d9d9d9',
            }),
          ],
        },
      },
      // Линии КС-2 и Поступления (левая ось)
      {
        data: lineData,
        type: 'line' as const,
        yField: 'value',
        colorField: 'type',
        scale: {
          color: {
            domain: ['КС-2', 'Поступления'],
            range: ['#1890ff', '#52c41a'],
          },
        },
        style: { lineWidth: 2.5 },
        axis: {
          y: {
            title: 'Нарастающий итог (млн руб.)',
            titleFontSize: 11,
            labelFormatter: axisFormatter,
          },
        },
        legend: false,
        tooltip: {
          items: [
            {
              channel: 'y',
              valueFormatter: (v: number) => formatMln(v) + ' млн',
            },
          ],
        },
      },
    ],
  };

  const title = (
    <span>
      Дебиторская задолженность: КС-2 vs Поступления{' '}
      <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{HELP_TEXT}</span>} overlayStyle={{ maxWidth: 520 }}>
        <InfoCircleOutlined className="bdr-bubble-help-icon" />
      </Tooltip>
    </span>
  );

  return (
    <div ref={chartRef}>
      <Card title={title} extra={<ShareChartButton chartRef={chartRef} title="Дебиторская задолженность" />} size="small" className="dashboard-chart-card">
        {/* KPI блок */}
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={6}>
            <Statistic
              title="Сдано по КС-2"
              value={formatMln(kpi.ks)}
              suffix="млн"
              valueStyle={{ fontSize: 15, fontWeight: 600, color: '#1890ff' }}
            />
          </Col>
          <Col xs={6}>
            <Statistic
              title="Оплачено заказчиком"
              value={formatMln(kpi.receipts)}
              suffix="млн"
              valueStyle={{ fontSize: 15, fontWeight: 600, color: '#52c41a' }}
            />
          </Col>
          <Col xs={6}>
            <Statistic
              title="Общий долг"
              value={formatMln(kpi.totalDebt)}
              suffix="млн"
              valueStyle={{ fontSize: 15, fontWeight: 600, color: '#fa8c16' }}
            />
          </Col>
          <Col xs={6}>
            <Statistic
              title="К взысканию"
              value={formatMln(kpi.problemDebt)}
              suffix="млн"
              valueStyle={{ fontSize: 15, fontWeight: 600, color: '#ff4d4f' }}
            />
          </Col>
        </Row>
        {/* Легенда */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              {item.isLine ? (
                <span style={{ width: 16, height: 3, background: item.color, display: 'inline-block', borderRadius: 1 }} />
              ) : (
                <span style={{ width: 12, height: 10, background: item.color, opacity: 0.75, display: 'inline-block', borderRadius: 2 }} />
              )}
              <span style={{ color: '#595959' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <DualAxes {...config} height={360} />
      </Card>
    </div>
  );
};
