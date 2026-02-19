import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import type { AerisCacheStats } from '../../types/aeris';
import { METRIC_LABELS } from '../../types/aeris';
import type { HourlyEntry } from '../../types/aeris-comparison';

interface ComparisonTableProps {
  v2HourlyData: (HourlyEntry | null)[];
  v3HourlyData: (HourlyEntry | null)[];
  selectedMetrics: (keyof AerisCacheStats)[];
  v2DayLabel: string | null;
  v3DayLabel: string | null;
}

const EMPTY_CELL = '—';

export default function ComparisonTable({
  v2HourlyData,
  v3HourlyData,
  selectedMetrics,
  v2DayLabel,
  v3DayLabel,
}: ComparisonTableProps) {
  const hasV2 = v2HourlyData.some((e) => e !== null);
  const hasV3 = v3HourlyData.some((e) => e !== null);

  if (!hasV2 && !hasV3) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        Hourly Comparison Table
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: 'rgba(30, 30, 46, 0.5)',
          maxHeight: 600,
          '& .MuiTableCell-root': {
            borderColor: 'divider',
            py: 0.75,
            px: 1.5,
            fontSize: '0.8rem',
          },
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  backgroundColor: 'rgba(17, 17, 27, 0.95)',
                  minWidth: 60,
                }}
              >
                Hour
              </TableCell>

              {/* V2 DateTime — always 2nd column */}
              <TableCell
                sx={{
                  fontWeight: 700,
                  backgroundColor: 'rgba(17, 17, 27, 0.95)',
                  color: 'primary.light',
                  minWidth: 120,
                }}
              >
                V2 DateTime{v2DayLabel ? ` (${v2DayLabel})` : ''}
              </TableCell>

              {/* Metric columns: V2 then V3 per metric */}
              {selectedMetrics.flatMap((metric) => [
                <TableCell
                  key={`v2-${metric}`}
                  align="right"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: 'rgba(17, 17, 27, 0.95)',
                    color: 'primary.light',
                    minWidth: 80,
                  }}
                >
                  V2 {METRIC_LABELS[metric]}
                </TableCell>,
                <TableCell
                  key={`v3-${metric}`}
                  align="right"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: 'rgba(17, 17, 27, 0.95)',
                    color: 'secondary.light',
                    minWidth: 80,
                  }}
                >
                  V3 {METRIC_LABELS[metric]}
                </TableCell>,
              ])}

              {/* V3 DateTime — always last column */}
              <TableCell
                sx={{
                  fontWeight: 700,
                  backgroundColor: 'rgba(17, 17, 27, 0.95)',
                  color: 'secondary.light',
                  minWidth: 120,
                }}
              >
                V3 DateTime{v3DayLabel ? ` (${v3DayLabel})` : ''}
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Array.from({ length: 24 }, (_, hour) => {
              const v2Entry = v2HourlyData[hour];
              const v3Entry = v3HourlyData[hour];

              return (
                <TableRow
                  key={hour}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {hour.toString().padStart(2, '0')}:00
                  </TableCell>

                  {/* V2 DateTime — 2nd column */}
                  <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    {v2Entry ? format(v2Entry.timestamp, 'MMM dd HH:mm') : EMPTY_CELL}
                  </TableCell>

                  {/* Metric values: V2 then V3 per metric */}
                  {selectedMetrics.flatMap((metric) => [
                    <TableCell
                      key={`v2-${metric}-${hour}`}
                      align="right"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {v2Entry ? v2Entry.stats[metric].toLocaleString() : EMPTY_CELL}
                    </TableCell>,
                    <TableCell
                      key={`v3-${metric}-${hour}`}
                      align="right"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {v3Entry ? v3Entry.stats[metric].toLocaleString() : EMPTY_CELL}
                    </TableCell>,
                  ])}

                  {/* V3 DateTime — last column */}
                  <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    {v3Entry ? format(v3Entry.timestamp, 'MMM dd HH:mm') : EMPTY_CELL}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
