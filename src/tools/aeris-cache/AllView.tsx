import BaseChart from '../../components/BaseChart';
import type { ParsedEntry } from './useAerisData';
import type { AerisCacheStats, ChartAnnotation } from '../../types/aeris';
import { METRIC_COLORS, METRIC_LABELS } from '../../types/aeris';

interface AllViewProps {
  data: ParsedEntry[];
  selectedMetrics: (keyof AerisCacheStats)[];
  annotations: ChartAnnotation[];
}

export default function AllView({ data, selectedMetrics, annotations }: AllViewProps) {
  if (!data.length) return null;

  const series = selectedMetrics.map((metric) => ({
    name: METRIC_LABELS[metric],
    data: data.map((entry) => ({
      x: entry.zonedTime.getTime(),
      y: entry.stats[metric],
    })),
    color: METRIC_COLORS[metric],
  }));

  return (
    <BaseChart
      series={series}
      annotations={annotations}
      height={450}
      id="aeris-all"
      options={{
        chart: { id: 'aeris-all' },
        xaxis: {
          title: { text: 'Time', style: { color: '#94a3b8', fontWeight: 500 } },
        },
        yaxis: {
          title: { text: 'Count', style: { color: '#94a3b8', fontWeight: 500 } },
        },
      }}
    />
  );
}
