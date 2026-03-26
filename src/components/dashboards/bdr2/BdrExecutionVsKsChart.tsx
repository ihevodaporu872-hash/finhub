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

1. Анализ «Разрыва» (Зона НЗП)
Расстояние между линией Выполнения и Актирования — ваше Незавершённое производство.

• Оранжевая/красная заливка: Выполнение > Актирование — копятся «замороженные» деньги.
• Зелёная заливка: Актирование > Выполнения — «закрытие хвостов».

2. Оценка Ритмичности
• Параллельные линии: Идеальная ситуация. Документооборот налажен.
• Пересекающиеся линии: Проблемы с ПТО или заказчик затягивает приёмку.`;

interface IMonthData {
  month: string;
  fact: number;
  ks: number;
}

const formatMln = (v: number): string =>
  (v / 1_000_000).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

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

    const result: IMonthData[] = order.map((m) => {
      const e = map.get(m)!;
      return { month: m, fact: e.fact, ks: e.ks };
    });

    // Обрезаем пустые периоды в начале
    let startIdx = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i].fact > 0 || result[i].ks > 0) { startIdx = i; break; }
    }

    // Обрезаем пустые периоды в конце (плоская линия без новых данных)
    let endIdx = result.length - 1;
    for (let i = result.length - 1; i > startIdx; i--) {
      if (result[i].fact !== result[i - 1]?.fact || result[i].ks !== result[i - 1]?.ks) {
        endIdx = i;
        break;
      }
    }

    return result.slice(startIdx, endIdx + 1);
  }, [data]);

  // KPI — последний месяц
  const kpi = useMemo(() => {
    const last = monthData[monthData.length - 1];
    if (!last) return { fact: 0, ks: 0, nzp: 0 };
    return { fact: last.fact, ks: last.ks, nzp: last.fact - last.ks };
  }, [monthData]);

  // Данные для графика
  const { lineData, areaSegments } = useMemo(() => {
    const lineData: Array<{ month: string; value: number; type: string }> = [];

    for (const m of monthData) {
      lineData.push({ month: m.month, value: m.fact, type: 'Выполнение' });
      lineData.push({ month: m.month, value: m.ks, type: 'Актирование (КС-2)' });
    }

    // Сегменты заливки между линиями
    const areaSegments: Array<{ month: string; upper: number; lower: number; fill: string }> = [];
    for (const m of monthData) {
      const factAbove = m.fact >= m.ks;
      areaSegments.push({
        month: m.month,
        upper: factAbove ? m.fact : m.ks,
        lower: factAbove ? m.ks : m.fact,
        fill: factAbove ? 'rgba(255, 122, 69, 0.18)' : 'rgba(82, 196, 26, 0.18)',
      });
    }

    return { lineData, areaSegments };
  }, [monthData]);

  // Tooltip map
  const tooltipMap = useMemo(() => {
    const map = new Map<string, IMonthData>();
    for (const m of monthData) map.set(m.month, m);
    return map;
  }, [monthData]);

  // Группируем area-сегменты по цвету для отдельных слоёв
  const areaGroups = useMemo(() => {
    const groups: Array<{ fill: string; data: Array<{ month: string; upper: number; lower: number }> }> = [];
    for (const seg of areaSegments) {
      const last = groups[groups.length - 1];
      if (last && last.fill === seg.fill) {
        last.data.push({ month: seg.month, upper: seg.upper, lower: seg.lower });
      } else {
        if (last) {
          last.data.push({ month: seg.month, upper: seg.upper, lower: seg.lower });
        }
        groups.push({ fill: seg.fill, data: [{ month: seg.month, upper: seg.upper, lower: seg.lower }] });
      }
    }
    return groups;
  }, [areaSegments]);

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
          return `<div style="padding:4px 0;font-size:13px;line-height:1.6">
            <div style="font-weight:600;margin-bottom:4px">${monthKey}</div>
            <div>Выполнение: <b>${formatMln(info.fact)} млн руб.</b></div>
            <div>КС-2: <b>${formatMln(info.ks)} млн руб.</b></div>
            <div>НЗП: <span style="color:${nzpColor};font-weight:600">${nzp >= 0 ? '+' : ''}${formatMln(nzp)} млн руб.</span></div>
          </div>`;
        },
      },
    },
    children: [
      // Заливка между линиями (ribbon)
      ...areaGroups.map((g, i) => ({
        data: g.data,
        type: 'area' as const,
        yField: 'upper',
        y1Field: 'lower',
        style: {
          fill: g.fill,
          stroke: 'transparent',
        },
        scale: { y: { key: 'val' } },
        axis: false,
        legend: false,
        tooltip: false,
        key: `area-${i}`,
      })),
      // Линии
      {
        data: lineData,
        type: 'line' as const,
        yField: 'value',
        colorField: 'type',
        scale: {
          y: { key: 'val' },
          color: {
            domain: ['Выполнение', 'Актирование (КС-2)'],
            range: ['#ff7a45', '#1890ff'],
          },
        },
        style: { lineWidth: 2.5 },
        axis: {
          x: {
            title: false,
            labelAutoRotate: true,
          },
          y: {
            title: 'Сумма (млн руб.)',
            titleFontSize: 11,
            labelFormatter: (v: number) => {
              const mln = v / 1_000_000;
              return mln % 1 === 0 ? mln.toFixed(0) : mln.toFixed(1);
            },
          },
        },
        legend: { position: 'bottom' as const },
        tooltip: {
          items: [
            {
              channel: 'y',
              valueFormatter: (v: number) => formatMln(v) + ' млн руб.',
            },
          ],
        },
      },
    ],
  };

  const title = (
    <span>
      Выполнение vs Актирование (КС-2){' '}
      <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{HELP_TEXT}</span>} overlayStyle={{ maxWidth: 520 }}>
        <InfoCircleOutlined className="bdr-bubble-help-icon" />
      </Tooltip>
    </span>
  );

  const nzpColor = kpi.nzp > 0 ? '#ff7a45' : '#52c41a';

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
        <DualAxes {...config} height={340} />
      </Card>
    </div>
  );
};
