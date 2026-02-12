import { useState } from 'react';
import { Box, TextField, Typography, Slider, Stack } from '@mui/material';
import BaseChart from '../../components/BaseChart';
import type { ParsedEntry } from './useAerisData';
import type { AerisCacheStats, ChartAnnotation } from '../../types/aeris';
import { METRIC_COLORS, METRIC_LABELS } from '../../types/aeris';

interface HourViewProps {
  data: ParsedEntry[];
  selectedMetrics: (keyof AerisCacheStats)[];
  annotations: ChartAnnotation[];
  getNearestToHour: (data: ParsedEntry[], hour: number, windowMinutes?: number) => Map<string, ParsedEntry>;
}

export default function HourView({
  data,
  selectedMetrics,
  annotations,
  getNearestToHour,
}: HourViewProps) {
  const [selectedHour, setSelectedHour] = useState(12);
  const [windowMinutes, setWindowMinutes] = useState(30);

  const hourlyData = getNearestToHour(data, selectedHour, windowMinutes);
  const sortedDays = Array.from(hourlyData.entries()).sort(([a], [b]) => a.localeCompare(b));

  const series = selectedMetrics.map((metric) => ({
    name: METRIC_LABELS[metric],
    data: sortedDays.map(([, entry]) => ({
      x: entry.zonedTime.getTime(),
      y: entry.stats[metric],
    })),
    color: METRIC_COLORS[metric],
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          p: 2,
          borderRadius: 2,
          backgroundColor: 'rgba(30, 30, 46, 0.4)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={1} sx={{ minWidth: 200, flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Hour of Day: {String(selectedHour).padStart(2, '0')}:00
          </Typography>
          <Slider
            value={selectedHour}
            onChange={(_, value) => setSelectedHour(value as number)}
            min={0}
            max={23}
            step={1}
            marks={[
              { value: 0, label: '0' },
              { value: 6, label: '6' },
              { value: 12, label: '12' },
              { value: 18, label: '18' },
              { value: 23, label: '23' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${String(v).padStart(2, '0')}:00`}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: '0.7rem',
                color: 'text.secondary',
              },
            }}
          />
        </Stack>

        <Stack spacing={0.5} sx={{ minWidth: 140 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Window (minutes)
          </Typography>
          <TextField
            type="number"
            value={windowMinutes}
            onChange={(e) => setWindowMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
            size="small"
            inputProps={{ min: 1, max: 120 }}
            sx={{ width: 100 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
            ±{windowMinutes}min around {String(selectedHour).padStart(2, '0')}:00
          </Typography>
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {sortedDays.length} / {new Set(data.map((d) => {
              const z = d.zonedTime;
              return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, '0')}-${String(z.getDate()).padStart(2, '0')}`;
            })).size} days matched
          </Typography>
        </Box>
      </Box>

      {/* Chart */}
      {sortedDays.length > 0 ? (
        <BaseChart
          series={series}
          annotations={annotations}
          height={400}
          id="aeris-hour"
          options={{
            chart: { id: 'aeris-hour' },
            xaxis: {
              type: 'datetime',
              title: { text: 'Date', style: { color: '#94a3b8', fontWeight: 500 } },
              labels: {
                format: 'dd MMM',
              },
            },
            yaxis: {
              title: { text: 'Count', style: { color: '#94a3b8', fontWeight: 500 } },
            },
            markers: {
              size: 5,
              hover: { size: 7 },
            },
          }}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">
            No entries found within ±{windowMinutes}min of {String(selectedHour).padStart(2, '0')}:00
          </Typography>
        </Box>
      )}
    </Box>
  );
}
