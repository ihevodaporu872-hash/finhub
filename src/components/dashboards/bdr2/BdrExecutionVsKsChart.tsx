import { type FC, useMemo, useRef } from 'react';
import { Card, Tooltip, Statistic, Row, Col } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { DualAxes } from '@ant-design/charts';
import type { IExecutionVsKsPoint } from '../../../types/dashboard';
import { ShareChartButton } from '../../common/ShareChartButton';

interface IProps {
  data: IExecutionVsKsPoint[];
}

const HELP_TEXT = `Как читать этот график:

1. Линии — нарастающий итог Выполнения и Актирования (КС-2).

2. Столбцы — месячная дельта (Выполнение минус КС-2):
• Оранжевый столбец вверх: выполнили больше, чем сдали — растёт НЗП.
• Зелёный столбец вниз: сдали больше, чем выполнили — закрытие хвостов.

3. Оценка ритмичности:
• Параллельные линии: документооборот налажен.
• Расходящиеся линии: проблемы с ПТО или заказчик затягивает приёмку.`;

interface IMonthData {
  month: string;
  fact: number;
  ks: number;
  prevFact: number;
  prevKs: number;
}

const formatMln = (v: number): string =>
  (v / 1_000_000).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const axisFormatter = (v: number): string => {
  const mln = v / 1_000_000;
  return mln % 1 === 0 ? mln.toFixed(0) : mln.toFixed(1);
};

const LEGEND_ITEMS = [
  { color: '#ff7a45', label: 'Выполнение (нараст.)', isLine: true },
  { color: '#1890ff', label: 'Актирование КС-2 (нараст.)', isLine: true },
  { color: '#ff7a45', label: 'Дельта + (рост НЗП)', isRect: true },
  { color: '#52c41a', label: 'Дельта − (закрытие)', isRect: true },
];

export const BdrExecutionVsKsChart: FC<IProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  // Собираем данные по месяцам из плоского массива
  const monthData = useMemo((): IMonthData[] => {
    const map = new Map<string, { fact: number; ks: number }>();
    const order: string[] = [];

    for (const pt of data) {
      if (!map.has(pt.month)) {
        map.set(pt.month, { fact: 0, ks: 0 });
        order.push(pt.month);
      }
      const entry = map.get(pt.month)!;
      if (pt.type === 'Выполнение') entry.fact = pt.value;
      else entry.ks = pt.value;
    }

    const raw = order.map((m) => {
      const e = map.get(m)!;
      return { month: m, fact: e.fact, ks: e.ks };
    });

    // Обрезаем пустые периоды в начале
    let startIdx = 0;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i].fact > 0 || raw[i].ks > 0) { startIdx = i; break; }
    }

    // Обрезаем пустые периоды в конце
    let endIdx = raw.length - 1;
    for (let i = raw.length - 1; i > startIdx; i--) {
      if (raw[i].fact !== raw[i - 1]?.fact || raw[i].ks !== raw[i - 1]?.ks) {
        endIdx = i;
        break;
      }
    }

    const sliced = raw.slice(startIdx, endIdx + 1);

    // Добавляем prev-значения для расчёта месячной дельты
    return sliced.map((m, i) => ({
      ...m,
      prevFact: i > 0 ? sliced[i - 1].fact : 0,
      prevKs: i > 0 ? sliced[i - 1].ks : 0,
    }));
  }, [data]);

  // KPI — последний месяц (кумулятивные значения)
  const kpi = useMemo(() => {
    const last = monthData[monthData.length - 1];
    if (!last) return { fact: 0, ks: 0, nzp: 0 };
    return { fact: last.fact, ks: last.ks, nzp: last.fact - last.ks };
  }, [monthData]);

  // Данные для графика
  const { lineData, deltaColumns } = useMemo(() => {
    const lineData: Array<{ month: string; value: number; type: string }> = [];
    const deltaColumns: Array<{ month: string; value: number; deltaColor: string }> = [];

    for (const m of monthData) {
      lineData.push({ month: m.month, value: m.fact, type: 'Выполнение' });
      lineData.push({ month: m.month, value: m.ks, type: 'Актирование (КС-2)' });

      // Месячная дельта = (выполнение за месяц) - (КС-2 за месяц)
      const monthFact = m.fact - m.prevFact;
      const monthKs = m.ks - m.prevKs;
      const delta = monthFact - monthKs;

      deltaColumns.push({
        month: m.month,
        value: delta,
        deltaColor: delta >= 0 ? 'positive' : 'negative',
      });
    }

    return { lineData, deltaColumns };
  }, [monthData]);

  // Tooltip map
  const tooltipMap = useMemo(() => {
    const map = new Map<string, { fact: number; ks: number; monthFact: number; monthKs: number; delta: number }>();
    for (const m of monthData) {
      const monthFact = m.fact - m.prevFact;
      const monthKs = m.ks - m.prevKs;
      map.set(m.month, {
        fact: m.fact,
        ks: m.ks,
        monthFact,
        monthKs,
        delta: monthFact - monthKs,
      });
    }
    return map;
  }, [monthData]);

  const config = {
    xField: 'month',
    interaction: {
      tooltip: {
        render: (_: unknown, { items }: { items: Array<{ value: unknown }> }) => {
          const firstItem = items[0] as { data?: Record<string, unknown> };
          const monthKey = (firstItem?.data?.month as string) || '';
          const info = tooltipMap.get(monthKey);
          if (!info) return '';
          const nzp = info.fact - info.ks;
          const nzpColor = nzp > 0 ? '#ff7a45' : '#52c41a';
          const deltaColor = info.delta >= 0 ? '#ff7a45' : '#52c41a';
          return `<div style="padding:4px 0;font-size:13px;line-height:1.6">
            <div style="font-weight:600;margin-bottom:4px">${monthKey}</div>
            <div>Выполнение (нараст.): <b>${formatMln(info.fact)} млн</b></div>
            <div>КС-2 (нараст.): <b>${formatMln(info.ks)} млн</b></div>
            <div>НЗП (накопл.): <span style="color:${nzpColor};font-weight:600">${nzp >= 0 ? '+' : ''}${formatMln(nzp)} млн</span></div>
            <div style="border-top:1px solid #f0f0f0;margin-top:4px;padding-top:4px">
              Дельта за месяц: <span style="color:${deltaColor};font-weight:600">${info.delta >= 0 ? '+' : ''}${formatMln(info.delta)} млн</span>
            </div>
          </div>`;
        },
      },
    },
    children: [
      // Столбцы месячной дельты (правая ось)
      {
        data: deltaColumns,
        type: 'interval' as const,
        yField: 'value',
        colorField: 'deltaColor',
        scale: {
          color: {
            domain: ['positive', 'negative'],
            range: ['#ff7a45', '#52c41a'],
          },
        },
        style: {
          fillOpacity: 0.55,
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
            title: 'Дельта за месяц (млн)',
            titleFontSize: 11,
            labelFormatter: axisFormatter,
          },
        },
        legend: false,
        tooltip: {
          items: [
            (d: Record<string, number>) => ({
              name: 'Дельта',
              value: formatMln(d.value) + ' млн',
              color: d.value >= 0 ? '#ff7a45' : '#52c41a',
            }),
          ],
        },
      },
      // Линии (нарастающий итог, левая ось)
      {
        data: lineData,
        type: 'line' as const,
        yField: 'value',
        colorField: 'type',
        scale: {
          color: {
            domain: ['Выполнение', 'Актирование (КС-2)'],
            range: ['#ff7a45', '#1890ff'],
          },
        },
        style: { lineWidth: 3 },
        axis: {
          y: {
            title: 'Сумма нараст. (млн руб.)',
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

  const nzpColor = kpi.nzp > 0 ? '#ff7a45' : '#52c41a';

  const title = (
    <span>
      Выполнение vs Актирование (КС-2){' '}
      <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{HELP_TEXT}</span>} overlayStyle={{ maxWidth: 520 }}>
        <InfoCircleOutlined className="bdr-bubble-help-icon" />
      </Tooltip>
    </span>
  );

  return (
    <div ref={chartRef}>
      <Card title={title} extra={<ShareChartButton chartRef={chartRef} title="Выполнение vs Актирование" />} size="small" className="dashboard-chart-card">
        {/* KPI блок */}
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={8}>
            <Statistic
              title="Выполнено на объекте"
              value={formatMln(kpi.fact)}
              suffix="млн руб."
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="Принято по КС-2"
              value={formatMln(kpi.ks)}
              suffix="млн руб."
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="Неотфактуровано (НЗП)"
              value={formatMln(kpi.nzp)}
              suffix="млн руб."
              valueStyle={{ fontSize: 16, fontWeight: 600, color: nzpColor }}
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
                <span style={{ width: 12, height: 10, background: item.color, opacity: 0.6, display: 'inline-block', borderRadius: 2 }} />
              )}
              <span style={{ color: '#595959' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <DualAxes {...config} height={340} />
      </Card>
    </div>
  );
};
