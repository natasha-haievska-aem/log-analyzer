import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Fade,
} from '@mui/material';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import JsonUploader from '../../components/JsonUploader';
import TimezoneSelector from '../../components/TimezoneSelector';
import DateTimeRangePicker from '../../components/DateTimeRangePicker';
import MetricSelector from '../../components/MetricSelector';
import ChartAnnotations from '../../components/ChartAnnotations';
import AllView from './AllView';
import DailyView from './DailyView';
import HourView from './HourView';
import { useAerisData } from './useAerisData';
import type { AerisLogEntry, AerisCacheStats, PresentationMode, ChartAnnotation } from '../../types/aeris';
import { AERIS_METRIC_FIELDS } from '../../types/aeris';

function isValidAerisData(data: unknown): data is AerisLogEntry[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true;
  const first = data[0];
  return (
    typeof first === 'object' &&
    first !== null &&
    '@timestamp' in first &&
    '@message' in first &&
    typeof first['@message'] === 'object' &&
    first['@message'] !== null &&
    'aerisCacheStats' in (first['@message'] as Record<string, unknown>)
  );
}

export default function AerisCacheTool() {
  const [rawData, setRawData] = useState<AerisLogEntry[] | null>(null);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<(keyof AerisCacheStats)[]>([...AERIS_METRIC_FIELDS]);
  const [mode, setMode] = useState<PresentationMode>('all');
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);

  const { filteredData, dateRange, dailyData, getNearestToHour } = useAerisData(
    rawData,
    timezone,
    startDate,
    endDate
  );

  // Auto-set date range when data is loaded
  useEffect(() => {
    if (dateRange.min && dateRange.max) {
      if (!startDate) setStartDate(dateRange.min);
      if (!endDate) setEndDate(dateRange.max);
    }
  }, [dateRange.min, dateRange.max, startDate, endDate]);

  const handleDataLoaded = useCallback((data: AerisLogEntry[]) => {
    setRawData(data);
    setStartDate(null);
    setEndDate(null);
    setAnnotations([]);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1400 }}>
      {/* Header */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Aeris Cache Statistics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Visualize Aeris cache hit/miss statistics over time from JSON log entries.
        </Typography>
      </Box>

      {/* File Upload */}
      <JsonUploader<AerisLogEntry[]>
        onDataLoaded={handleDataLoaded}
        validate={isValidAerisData}
        label="Upload Aeris cache statistics JSON"
      />

      {/* Controls & Chart Area */}
      {rawData && (
        <Fade in>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Controls Row */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(30, 30, 46, 0.5)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, minWidth: 280 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <TimezoneSelector value={timezone} onChange={setTimezone} />
                  <DateTimeRangePicker
                    start={startDate}
                    end={endDate}
                    onStartChange={setStartDate}
                    onEndChange={setEndDate}
                  />
                </Box>
                <MetricSelector selected={selectedMetrics} onChange={setSelectedMetrics} />
              </Box>
            </Box>

            {/* Mode Selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, newMode) => newMode && setMode(newMode)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 0.5,
                    gap: 0.75,
                    border: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                <ToggleButton value="all">
                  <ViewTimelineIcon sx={{ fontSize: 18 }} />
                  All
                </ToggleButton>
                <ToggleButton value="daily">
                  <CalendarViewDayIcon sx={{ fontSize: 18 }} />
                  Daily
                </ToggleButton>
                <ToggleButton value="hour">
                  <AccessTimeIcon sx={{ fontSize: 18 }} />
                  Specific Hour
                </ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {filteredData.length} entries
              </Typography>
            </Box>

            {/* Annotations */}
            <ChartAnnotations annotations={annotations} onChange={setAnnotations} />

            <Divider />

            {/* Chart Views */}
            {mode === 'all' && (
              <AllView data={filteredData} selectedMetrics={selectedMetrics} annotations={annotations} />
            )}
            {mode === 'daily' && (
              <DailyView dailyData={dailyData} selectedMetrics={selectedMetrics} annotations={annotations} />
            )}
            {mode === 'hour' && (
              <HourView
                data={filteredData}
                selectedMetrics={selectedMetrics}
                annotations={annotations}
                getNearestToHour={getNearestToHour}
              />
            )}
          </Box>
        </Fade>
      )}

      {/* Empty State */}
      {!rawData && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
            gap: 1,
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Upload a JSON file to begin analysis
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 400, textAlign: 'center' }}>
            The file should contain an array of Aeris cache statistics log entries with @timestamp and @message.aerisCacheStats fields.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
