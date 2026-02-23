import { useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow as MuiTableRow,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useState } from 'react';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import type { SearchResult, TableRow } from '../../types/v2-message-search';

/** Colors for differentiating search patterns */
const PATTERN_COLORS = [
  '#818cf8', // indigo
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#fb923c', // orange
  '#2dd4bf', // teal
];

function getPatternColor(index: number): string {
  return PATTERN_COLORS[index % PATTERN_COLORS.length];
}

interface MessageSearchTableProps {
  results: SearchResult[];
  timeOrderedRows: TableRow[];
  timezone: string;
  patterns: string[];
}

/**
 * Formats the "Times" column content based on count threshold.
 * - > 10: show range "HH:MM:SS – HH:MM:SS"
 * - ≤ 10: show each individually "HH:MM:SS, HH:MM:SS, ..."
 */
function formatTimes(row: TableRow, timezone: string): string {
  if (row.entries.length === 0) return '—';

  const formatTime = (d: Date) => {
    const zoned = toZonedTime(d, timezone);
    return format(zoned, 'HH:mm:ss');
  };

  if (row.count > 10) {
    const first = row.entries[0];
    const last = row.entries[row.entries.length - 1];
    return `${formatTime(first.timestamp)} – ${formatTime(last.timestamp)}`;
  }

  return row.entries.map((e) => formatTime(e.timestamp)).join(', ');
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
}

/** Truncates long pattern strings for display in chips / table cells */
function truncatePattern(pattern: string, maxLen = 60): string {
  if (pattern.length <= maxLen) return pattern;
  return pattern.slice(0, maxLen) + '…';
}

/** Grouped-by-message view: collapsible sections per pattern */
function GroupedView({
  results,
  timezone,
  patterns,
}: {
  results: SearchResult[];
  timezone: string;
  patterns: string[];
}) {
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(
    () => new Set(patterns)
  );

  const togglePattern = (pattern: string) => {
    setExpandedPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {results.map((result, idx) => {
        const isExpanded = expandedPatterns.has(result.pattern);
        const color = getPatternColor(idx);
        const rows: TableRow[] = result.hourlyGroups.map((g) => ({
          date: g.date,
          hour: g.hour,
          pattern: result.pattern,
          count: g.count,
          entries: g.entries,
        }));

        return (
          <Paper
            key={result.pattern}
            sx={{
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'rgba(30, 30, 46, 0.5)',
            }}
          >
            {/* Collapsible header */}
            <Box
              onClick={() => togglePattern(result.pattern)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.06)' },
                borderBottom: isExpanded ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              </IconButton>
              <Box
                sx={{
                  width: 4,
                  height: 24,
                  borderRadius: 1,
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={result.pattern}
              >
                {result.pattern}
              </Typography>
              <Chip
                label={`${result.totalCount} matches`}
                size="small"
                sx={{
                  backgroundColor: `${color}22`,
                  color,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Box>

            {/* Collapsible content */}
            <Collapse in={isExpanded}>
              {rows.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <MuiTableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 120 }}>
                          Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 80 }}>
                          Hour
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 80 }} align="center">
                          Count
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          Times
                        </TableCell>
                      </MuiTableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, rowIdx) => (
                        <MuiTableRow
                          key={`${row.date}-${row.hour}-${rowIdx}`}
                          sx={{ '&:last-child td': { borderBottom: 0 } }}
                        >
                          <TableCell sx={{ fontSize: '0.8rem' }}>
                            {formatDate(row.date)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {formatHour(row.hour)}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {row.count}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'text.secondary',
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={formatTimes(row, timezone)}
                          >
                            {formatTimes(row, timezone)}
                          </TableCell>
                        </MuiTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No matches found for this pattern
                  </Typography>
                </Box>
              )}
            </Collapse>
          </Paper>
        );
      })}
    </Box>
  );
}

export default function MessageSearchTable({
  results,
  timeOrderedRows,
  timezone,
  patterns,
}: MessageSearchTableProps) {
  const [groupByMessage, setGroupByMessage] = useState(false);

  // Build a pattern → color index map for consistent coloring
  const patternColorMap = useMemo(() => {
    const map = new Map<string, string>();
    patterns.forEach((p, i) => map.set(p, getPatternColor(i)));
    return map;
  }, [patterns]);

  const totalMatches = results.reduce((sum, r) => sum + r.totalCount, 0);

  if (timeOrderedRows.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Controls row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Results
          </Typography>
          <Chip
            label={`${totalMatches} total matches`}
            size="small"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'primary.light',
            }}
          />
        </Box>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={groupByMessage}
              onChange={(e) => setGroupByMessage(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Group by message
            </Typography>
          }
        />
      </Box>

      {/* Table content */}
      {groupByMessage ? (
        <GroupedView results={results} timezone={timezone} patterns={patterns} />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'rgba(30, 30, 46, 0.5)',
          }}
        >
          <Table size="small">
            <TableHead>
              <MuiTableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 120 }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 80 }}>
                  Hour
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                  Message Pattern
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 80 }} align="center">
                  Count
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                  Times
                </TableCell>
              </MuiTableRow>
            </TableHead>
            <TableBody>
              {timeOrderedRows.map((row, idx) => {
                const color = patternColorMap.get(row.pattern) ?? '#818cf8';
                return (
                  <MuiTableRow
                    key={`${row.date}-${row.hour}-${row.pattern}-${idx}`}
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {formatHour(row.hour)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 400,
                          }}
                          title={row.pattern}
                        >
                          {truncatePattern(row.pattern)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {row.count}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                        maxWidth: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={formatTimes(row, timezone)}
                    >
                      {formatTimes(row, timezone)}
                    </TableCell>
                  </MuiTableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
