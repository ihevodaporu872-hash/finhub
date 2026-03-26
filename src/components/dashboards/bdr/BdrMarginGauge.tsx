import { type FC, useRef, useMemo } from 'react';
import { Card, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { IBdrDashboardData } from '../../../types/dashboard';
import { ShareChartButton } from '../../common/ShareChartButton';

interface IProps {
  data: IBdrDashboardData;
}

const HELP_TEXT = `Валовая маржинальность = (Выручка − Себестоимость) / Выручка × 100%.

• Зелёная дуга — факт выше или равен плану.
• Красная/жёлтая дуга — факт ниже плана.
• Чёрная черта на шкале — плановый показатель.

Если маржа высокая (25%+), а чистая прибыль низкая — «бэк-офис» слишком раздут.
При росте объёмов маржа часто падает из-за демпинга на тендерах.`;

const GAUGE_MAX = 50; // Максимум шкалы — 50%
const RADIUS = 100;
const STROKE_WIDTH = 18;
const CENTER_X = 120;
const CENTER_Y = 115;

// Дуга от 210° до -30° (240° total sweep), по часовой стрелке
const START_ANGLE = 210;
const SWEEP_ANGLE = 240;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const sweep = startAngle - endAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function getColor(fact: number, plan: number): string {
  if (fact >= plan) return '#52c41a';
  if (fact >= plan * 0.8) return '#faad14';
  return '#ff4d4f';
}

export const BdrMarginGauge: FC<IProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const factPct = data.marginPercent;
  const planPct = useMemo(() => {
    const { revenuePlan, marginalProfitPlan } = data.kpis;
    return revenuePlan ? (marginalProfitPlan / revenuePlan) * 100 : 0;
  }, [data.kpis]);
  const profitMln = data.kpis.marginalProfit / 1_000_000;

  const clampedFact = Math.max(0, Math.min(factPct, GAUGE_MAX));
  const clampedPlan = Math.max(0, Math.min(planPct, GAUGE_MAX));
  const color = getColor(factPct, planPct);

  // Углы дуг
  const bgEndAngle = START_ANGLE - SWEEP_ANGLE;
  const factEndAngle = START_ANGLE - (clampedFact / GAUGE_MAX) * SWEEP_ANGLE;
  const planAngle = START_ANGLE - (clampedPlan / GAUGE_MAX) * SWEEP_ANGLE;

  // Маркер плана
  const markerInner = polarToCartesian(CENTER_X, CENTER_Y, RADIUS - STROKE_WIDTH / 2 - 4, planAngle);
  const markerOuter = polarToCartesian(CENTER_X, CENTER_Y, RADIUS + STROKE_WIDTH / 2 + 4, planAngle);

  const title = (
    <span>
      Валовая маржинальность{' '}
      <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{HELP_TEXT}</span>} overlayStyle={{ maxWidth: 480 }}>
        <InfoCircleOutlined className="bdr-bubble-help-icon" />
      </Tooltip>
    </span>
  );

  return (
    <div ref={chartRef}>
      <Card title={title} extra={<ShareChartButton chartRef={chartRef} title="Валовая маржинальность" />} size="small" className="dashboard-chart-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <svg width={240} height={160} viewBox="0 0 240 160">
            {/* Фоновая дуга (серая) */}
            <path
              d={describeArc(CENTER_X, CENTER_Y, RADIUS, START_ANGLE, bgEndAngle)}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
            {/* Заливка факта */}
            {clampedFact > 0 && (
              <path
                d={describeArc(CENTER_X, CENTER_Y, RADIUS, START_ANGLE, factEndAngle)}
                fill="none"
                stroke={color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
              />
            )}
            {/* Целевой маркер (план) */}
            {clampedPlan > 0 && (
              <line
                x1={markerInner.x}
                y1={markerInner.y}
                x2={markerOuter.x}
                y2={markerOuter.y}
                stroke="#262626"
                strokeWidth={3}
                strokeLinecap="round"
              />
            )}
            {/* Подписи 0% и MAX% */}
            <text x={20} y={155} fontSize={11} fill="#999" textAnchor="middle">0%</text>
            <text x={220} y={155} fontSize={11} fill="#999" textAnchor="middle">{GAUGE_MAX}%</text>
          </svg>

          {/* Центральная информация */}
          <div style={{ textAlign: 'center', marginTop: -20 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1.2 }}>
              {factPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 4 }}>
              План: {planPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 2 }}>
              {profitMln >= 0 ? '+' : ''}{profitMln.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} млн руб.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
