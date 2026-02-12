import { Box, Typography, Chip } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { ParsedEntry } from './useAerisData';
import type { AerisCacheStats, ChartAnnotation } from '../../types/aeris';
import { METRIC_COLORS, METRIC_LABELS } from '../../types/aeris';

interface DailyViewProps {
  dailyData: Map<string, ParsedEntry[]>;
  selectedMetrics: (keyof AerisCacheStats)[];
  annotations: ChartAnnotation[];
}

export default function DailyView({ dailyData, selectedMetrics, annotations }: DailyViewProps) {
  const days = Array.from(dailyData.entries());

  const annotationConfig: ApexOptions['annotations'] = {
    yaxis: annotations
      .filter((a) => a.type === 'yaxis')
      .map((a) => ({
        y: a.y!,
        borderColor: a.color,
        strokeDashArray: 4,
        label: {
          text: a.label,
          borderColor: a.color,
          style: { color: '#fff', background: a.color, fontSize: '11px' },
        },
      })),
  };

  if (!days.length) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {days.map(([dayKey, entries]) => {
        const series = selectedMetrics.map((metric) => ({
          name: METRIC_LABELS[metric],
          data: entries.map((entry) => ({
            x: entry.zonedTime.getTime(),
            y: entry.stats[metric],
          })),
          color: METRIC_COLORS[metric],
        }));

        const chartOptions: ApexOptions = {
          chart: {
            id: `daily-${dayKey}`,
            group: 'daily-sync',
            type: 'line',
            background: 'transparent',
            toolbar: { show: true },
            zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
            animations: { enabled: false },
          },
          theme: { mode: 'dark' },
          grid: {
            borderColor: '#334155',
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
          },
          stroke: { curve: 'smooth', width: 2 },
          xaxis: {
            type: 'datetime',
            labels: {
              style: { colors: '#94a3b8', fontSize: '10px' },
              datetimeUTC: false,
              format: 'HH:mm',
              datetimeFormatter: {
                hour: 'HH:mm',
                minute: 'HH:mm:ss',
              },
            },
          },
          yaxis: {
            labels: {
              style: { colors: '#94a3b8', fontSize: '10px' },
              formatter: (val: number) => (val !== undefined && val !== null ? val.toFixed(0) : ''),
            },
          },
          tooltip: { theme: 'dark', x: { format: 'HH:mm:ss' } },
          legend: { show: false },
          dataLabels: { enabled: false },
          annotations: annotationConfig,
        };

        return (
          <Box
            key={dayKey}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              backgroundColor: 'rgba(30, 30, 46, 0.3)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {dayKey}
              </Typography>
              <Chip
                label={`${entries.length} entries`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            <ReactApexChart
              options={chartOptions}
              series={series}
              type="line"
              height={280}
            />
          </Box>
        );
      })}
    </Box>
  );
}
