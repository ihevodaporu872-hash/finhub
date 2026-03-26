import { type FC, useMemo, useRef, useState } from 'react';
import { Card, Radio, Space, Statistic, Row, Col } from 'antd';
import { DualAxes } from '@ant-design/charts';
import type { IBddsDashboardData } from '../../../types/dashboard';
import { ShareChartButton } from '../../common/ShareChartButton';

type ChartMode = 'monthly' | 'cumulative';

interface IProps {
  data: IBddsDashboardData;
}

const formatMln = (v: number): string =>
  (v / 1_000_000).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const axisFormatter = (v: number): string => {
  const mln = v / 1_000_000;
  return mln % 1 === 0 ? mln.toFixed(0) : mln.toFixed(1);
};

// Определяем текущий месяц для маркера «Сегодня»
const MONTH_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const now = new Date();
const currentMonthLabel = `${MONTH_SHORT[now.getMonth()]} ${String(now.getFullYear()).slice(2)}`;

export const BddsPlanFactChart: FC<IProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ChartMode>('cumulative');

  const { months, planMap, factMap, lastFactMonth } = useMemo(() => {
    const months: string[] = [];
    const planMap = new Map<string, number>();
    const factMap = new Map<string, number>();
    let lastFactMonth = '';

    for (const pt of data.planFactIncome) {
      if (pt.type === 'План') {
        planMap.set(pt.month, pt.value);
        months.push(pt.month);
      } else {
        factMap.set(pt.month, pt.value);
        if (pt.value > 0) lastFactMonth = pt.month;
      }
    }

    return { months, planMap, factMap, lastFactMonth };
  }, [data.planFactIncome]);

  // Месячный режим
  const monthlyData = useMemo(() => {
    const planLine: Array<{ month: string; value: number; type: string }> = [];
    const factLine: Array<{ month: string; value: number; type: string }> = [];
    const redArea: Array<{ month: string; upper: number; lower: number }> = [];
    const greenArea: Array<{ month: string; upper: number; lower: number }> = [];

    let reachedEnd = false;
    for (const m of months) {
      const plan = planMap.get(m) ?? 0;
      const fact = factMap.get(m) ?? 0;

      planLine.push({ month: m, value: plan, type: 'План' });

      if (!reachedEnd) {
        factLine.push({ month: m, value: fact, type: 'Факт' });
        if (plan > fact) {
          redArea.push({ month: m, upper: plan, lower: fact });
        } else {
          greenArea.push({ month: m, upper: fact, lower: plan });
        }
      }

      if (m === lastFactMonth) reachedEnd = true;
    }

    return { planLine, factLine, redArea, greenArea };
  }, [months, planMap, factMap, lastFactMonth]);

  // Кумулятивный режим
  const cumulativeData = useMemo(() => {
    const planLine: Array<{ month: string; value: number; type: string }> = [];
    const factLine: Array<{ month: string; value: number; type: string }> = [];
    const redArea: Array<{ month: string; upper: number; lower: number }> = [];
    const greenArea: Array<{ month: string; upper: number; lower: number }> = [];

    let cumPlan = 0, cumFact = 0;
    let reachedEnd = false;

    for (const m of months) {
      cumPlan += planMap.get(m) ?? 0;
      cumFact += factMap.get(m) ?? 0;

      planLine.push({ month: m, value: cumPlan, type: 'План' });

      if (!reachedEnd) {
        factLine.push({ month: m, value: cumFact, type: 'Факт' });
        if (cumPlan > cumFact) {
          redArea.push({ month: m, upper: cumPlan, lower: cumFact });
        } else {
          greenArea.push({ month: m, upper: cumFact, lower: cumPlan });
        }
      }

      if (m === lastFactMonth) reachedEnd = true;
    }

    return { planLine, factLine, redArea, greenArea };
  }, [months, planMap, factMap, lastFactMonth]);

  // KPI — кумулятивные на последний фактический месяц
  const kpi = useMemo(() => {
    let cumPlan = 0, cumFact = 0;
    for (const m of months) {
      cumPlan += planMap.get(m) ?? 0;
      cumFact += factMap.get(m) ?? 0;
      if (m === lastFactMonth) break;
    }
    return { plan: cumPlan, fact: cumFact, deficit: cumPlan - cumFact };
  }, [months, planMap, factMap, lastFactMonth]);

  // Tooltip map (кумулятивный)
  const tooltipMap = useMemo(() => {
    const map = new Map<string, { plan: number; fact: number; deficit: number; monthPlan: number; monthFact: number }>();
    let cumPlan = 0, cumFact = 0;
    let reachedEnd = false;
    for (const m of months) {
      const mp = planMap.get(m) ?? 0;
      const mf = factMap.get(m) ?? 0;
      cumPlan += mp;
      if (!reachedEnd) cumFact += mf;
      map.set(m, {
        plan: cumPlan,
        fact: reachedEnd ? -1 : cumFact,
        deficit: reachedEnd ? -1 : cumPlan - cumFact,
        monthPlan: mp,
        monthFact: reachedEnd ? -1 : mf,
      });
      if (m === lastFactMonth) reachedEnd = true;
    }
    return map;
  }, [months, planMap, factMap, lastFactMonth]);

  const buildConfig = (isMonthly: boolean) => {
    const d = isMonthly ? monthlyData : cumulativeData;
    const allLines = [...d.planLine, ...d.factLine];

    return {
      xField: 'month',
      interaction: {
        tooltip: {
          render: (_: unknown, { items }: { items: Array<{ value: unknown }> }) => {
            const firstItem = items[0] as { data?: Record<string, unknown> };
            const monthKey = (firstItem?.data?.month as string) || '';
            const info = tooltipMap.get(monthKey);
            if (!info) return '';

            if (isMonthly) {
              const hasFact = info.monthFact >= 0;
              return `<div style="padding:4px 0;font-size:13px;line-height:1.6">
                <div style="font-weight:600;margin-bottom:4px">${monthKey}</div>
                <div>План: <b>${formatMln(info.monthPlan)} млн</b></div>
                ${hasFact ? `<div>Факт: <b>${formatMln(info.monthFact)} млн</b></div>
                <div>Отклонение: <span style="color:${info.monthPlan - info.monthFact > 0 ? '#ff4d4f' : '#52c41a'};font-weight:600">${info.monthPlan - info.monthFact > 0 ? '-' : '+'}${formatMln(Math.abs(info.monthPlan - info.monthFact))} млн</span></div>` : '<div style="color:#8c8c8c">Факт: нет данных</div>'}
              </div>`;
            }

            const hasFact = info.fact >= 0;
            return `<div style="padding:4px 0;font-size:13px;line-height:1.6">
              <div style="font-weight:600;margin-bottom:4px">${monthKey}</div>
              <div>План (нараст.): <b>${formatMln(info.plan)} млн</b></div>
              ${hasFact ? `<div>Факт (нараст.): <b>${formatMln(info.fact)} млн</b></div>
              <div>Отставание: <span style="color:${info.deficit > 0 ? '#ff4d4f' : '#52c41a'};font-weight:600">${info.deficit > 0 ? '-' : '+'}${formatMln(Math.abs(info.deficit))} млн</span></div>` : '<div style="color:#8c8c8c">Факт: нет данных</div>'}
            </div>`;
          },
        },
      },
      children: [
        // Красная заливка (план > факт)
        ...(d.redArea.length > 0 ? [{
          data: d.redArea,
          type: 'area' as const,
          xField: 'month',
          yField: 'upper',
          y1Field: 'lower',
          scale: { y: { key: 'yShared', independent: false } },
          style: { fill: '#ff4d4f', fillOpacity: 0.2, stroke: 'transparent' },
          tooltip: false,
          axis: false,
          legend: false,
        }] : []),
        // Зеленая заливка (факт > план)
        ...(d.greenArea.length > 0 ? [{
          data: d.greenArea,
          type: 'area' as const,
          xField: 'month',
          yField: 'upper',
          y1Field: 'lower',
          scale: { y: { key: 'yShared', independent: false } },
          style: { fill: '#52c41a', fillOpacity: 0.2, stroke: 'transparent' },
          tooltip: false,
          axis: false,
          legend: false,
        }] : []),
        // Линии план + факт
        {
          data: allLines,
          type: 'line' as const,
          yField: 'value',
          colorField: 'type',
          scale: {
            y: { key: 'yShared', independent: false },
            color: {
              domain: ['План', 'Факт'],
              range: ['#1890ff', '#52c41a'],
            },
          },
          axis: {
            x: {
              title: false,
              labelAutoRotate: false,
              labelAutoHide: true,
              labelAutoEllipsis: true,
            },
            y: {
              title: 'Сумма (млн руб.)',
              titleFontSize: 11,
              labelFormatter: axisFormatter,
            },
          },
          style: { lineWidth: 2.5 },
          legend: { position: 'bottom' as const },
          tooltip: {
            items: [
              {
                channel: 'y',
                valueFormatter: (v: number) => formatMln(v) + ' млн',
              },
            ],
          },
        },
        // Вертикальная линия «Сегодня»
        ...(months.includes(currentMonthLabel) ? [{
          type: 'lineX' as const,
          data: [currentMonthLabel],
          style: {
            stroke: '#8c8c8c',
            strokeOpacity: 0.6,
            lineDash: [6, 4],
            lineWidth: 1,
          },
          label: {
            text: 'Сегодня',
            position: 'top' as const,
            style: { fontSize: 10, fill: '#8c8c8c', dy: -4 },
          },
        }] : []),
      ],
    };
  };

  const deficitColor = kpi.deficit > 0 ? '#ff4d4f' : '#52c41a';

  const titleExtra = (
    <Space size="small">
      <Radio.Group
        value={mode}
        onChange={e => setMode(e.target.value)}
        size="small"
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="monthly">Помесячно</Radio.Button>
        <Radio.Button value="cumulative">Нарастающий итог</Radio.Button>
      </Radio.Group>
      <ShareChartButton chartRef={chartRef} title="Поступления план vs факт" />
    </Space>
  );

  return (
    <div ref={chartRef}>
      <Card title="Поступления: план vs факт" extra={titleExtra} size="small" className="dashboard-chart-card">
        {/* KPI блок */}
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={8}>
            <Statistic
              title="Плановые поступления"
              value={formatMln(kpi.plan)}
              suffix="млн руб."
              valueStyle={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="Фактические поступления"
              value={formatMln(kpi.fact)}
              suffix="млн руб."
              valueStyle={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title={kpi.deficit > 0 ? 'Дефицит' : 'Опережение'}
              value={formatMln(Math.abs(kpi.deficit))}
              suffix="млн руб."
              valueStyle={{ fontSize: 16, fontWeight: 600, color: deficitColor }}
            />
          </Col>
        </Row>
        <DualAxes {...buildConfig(mode === 'monthly')} height={300} />
      </Card>
    </div>
  );
};
