import { Box, Typography } from '@mui/material';
import BaseChart from '../../components/BaseChart';
import type { AerisCacheStats, ChartAnnotation } from '../../types/aeris';
import { METRIC_COLORS, METRIC_LABELS } from '../../types/aeris';
import type { HourlyEntry } from '../../types/aeris-comparison';

interface ComparisonChartProps {
  v2HourlyData: (HourlyEntry | null)[];
  v3HourlyData: (HourlyEntry | null)[];
  selectedMetrics: (keyof AerisCacheStats)[];
  annotations: ChartAnnotation[];
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  `${i.toString().padStart(2, '0')}:00`
);

interface LegendItem {
  label: string;
  color: string;
  dashed: boolean;
}

export default function ComparisonChart({
  v2HourlyData,
  v3HourlyData,
  selectedMetrics,
  annotations,
}: ComparisonChartProps) {
  const hasV2 = v2HourlyData.some((e) => e !== null);
  const hasV3 = v3HourlyData.some((e) => e !== null);

  if (!hasV2 && !hasV3) return null;

  const legendItems: LegendItem[] = [];
  const series = selectedMetrics.flatMap((metric) => {
    const result = [];

    if (hasV2) {
      legendItems.push({
        label: `V2 ${METRIC_LABELS[metric]}`,
        color: METRIC_COLORS[metric],
        dashed: true,
      });
      result.push({
        name: `V2 ${METRIC_LABELS[metric]}`,
        data: v2HourlyData.map((entry, i) => ({
          x: HOUR_LABELS[i],
          y: entry?.stats[metric] ?? null,
        })),
        color: METRIC_COLORS[metric],
      });
    }

    if (hasV3) {
      legendItems.push({
        label: `V3 ${METRIC_LABELS[metric]}`,
        color: METRIC_COLORS[metric],
        dashed: false,
      });
      result.push({
        name: `V3 ${METRIC_LABELS[metric]}`,
        data: v3HourlyData.map((entry, i) => ({
          x: HOUR_LABELS[i],
          y: entry?.stats[metric] ?? null,
        })),
        color: METRIC_COLORS[metric],
      });
    }

    return result;
  });

  return (
    <Box>
      {/* Custom Legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1, ml: 1 }}>
        {legendItems.map((item) => (
          <Box
            key={item.label}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
          >
            <svg width="28" height="12">
              <line
                x1="0"
                y1="6"
                x2="28"
                y2="6"
                stroke={item.color}
                strokeWidth="2.5"
                strokeDasharray={item.dashed ? '6 4' : 'none'}
              />
            </svg>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <BaseChart
        series={series}
        annotations={annotations}
        height={450}
        id="aeris-comparison"
        options={{
          chart: {
            id: 'aeris-comparison',
            animations: { enabled: false },
          },
          xaxis: {
            type: 'category',
            categories: HOUR_LABELS,
            title: { text: 'Hour of Day', style: { color: '#94a3b8', fontWeight: 500 } },
            labels: {
              style: { colors: '#94a3b8', fontSize: '10px' },
              rotateAlways: false,
            },
          },
          yaxis: {
            title: { text: 'Count', style: { color: '#94a3b8', fontWeight: 500 } },
          },
          stroke: {
            curve: 'smooth',
            width: selectedMetrics.flatMap(() => {
              const widths = [];
              if (hasV2) widths.push(2.5);
              if (hasV3) widths.push(2.5);
              return widths;
            }),
            dashArray: selectedMetrics.flatMap(() => {
              const dashes = [];
              if (hasV2) dashes.push(8);   // dashed for v2
              if (hasV3) dashes.push(0);   // solid for v3
              return dashes;
            }),
          },
          tooltip: {
            theme: 'dark',
            custom: ({ series: s, dataPointIndex, w }: {
              series: number[][];
              dataPointIndex: number;
              w: { config: { series: { name: string; color: string }[]; stroke: { dashArray: number[] } }; globals: { categoryLabels: string[] } };
            }) => {
              const xLabel = w.globals.categoryLabels?.[dataPointIndex] ?? HOUR_LABELS[dataPointIndex];
              const dashArrays = w.config.stroke.dashArray || [];
              let rows = '';
              for (let i = 0; i < s.length; i++) {
                const val = s[i][dataPointIndex];
                if (val === null || val === undefined) continue;
                const cfg = w.config.series[i];
                const isDashed = (dashArrays[i] || 0) > 0;
                const dashAttr = isDashed ? 'stroke-dasharray="6 4"' : '';
                const lineSvg = `<svg width="20" height="10" style="margin-right:6px;vertical-align:middle"><line x1="0" y1="5" x2="20" y2="5" stroke="${cfg.color}" stroke-width="2.5" ${dashAttr}/></svg>`;
                rows += `<div style="display:flex;align-items:center;padding:3px 8px;gap:4px">${lineSvg}<span style="font-size:12px">${cfg.name}:</span><strong style="font-size:12px;margin-left:auto">${val.toLocaleString()}</strong></div>`;
              }
              return `<div style="background:#1e1e2e;border:1px solid #333;border-radius:6px;padding:6px 0;min-width:180px"><div style="padding:2px 8px 4px;font-size:11px;color:#94a3b8;border-bottom:1px solid #333;margin-bottom:2px">Hour: ${xLabel}</div>${rows}</div>`;
            },
          },
          legend: {
            show: false, // using custom legend above
          },
          markers: {
            size: 3,
            strokeWidth: 0,
          },
        }}
      />
    </Box>
  );
}
