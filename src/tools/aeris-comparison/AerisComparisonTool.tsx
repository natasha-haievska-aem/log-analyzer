import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Divider,
  Fade,
} from '@mui/material';
import JsonUploader from '../../components/JsonUploader';
import LogUploader from '../../components/LogUploader';
import MetricSelector from '../../components/MetricSelector';
import ChartAnnotations from '../../components/ChartAnnotations';
import TimezoneSelector from '../../components/TimezoneSelector';
import DaySelector from './DaySelector';
import ComparisonChart from './ComparisonChart';
import ComparisonTable from './ComparisonTable';
import { parseV2Log } from './parseV2Log';
import { useComparisonData } from './useComparisonData';
import type { AerisLogEntry, AerisCacheStats, ChartAnnotation } from '../../types/aeris';
import { AERIS_METRIC_FIELDS } from '../../types/aeris';
import type { V2LogEntry } from '../../types/aeris-comparison';

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

function isValidV2Data(data: V2LogEntry[]): boolean {
  return data.length > 0;
}

export default function AerisComparisonTool() {
  const [v2Data, setV2Data] = useState<V2LogEntry[] | null>(null);
  const [v3Data, setV3Data] = useState<AerisLogEntry[] | null>(null);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [selectedV2Day, setSelectedV2Day] = useState<string | null>(null);
  const [selectedV3Day, setSelectedV3Day] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<(keyof AerisCacheStats)[]>([...AERIS_METRIC_FIELDS]);
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);

  const { v2DayOptions, v3DayOptions, v2HourlyData, v3HourlyData } = useComparisonData(
    v2Data,
    v3Data,
    selectedV2Day,
    selectedV3Day,
    timezone
  );

  const handleV2Loaded = useCallback((data: V2LogEntry[]) => {
    setV2Data(data);
    setSelectedV2Day(null);
    setAnnotations([]);
  }, []);

  const handleV3Loaded = useCallback((data: AerisLogEntry[]) => {
    setV3Data(data);
    setSelectedV3Day(null);
    setAnnotations([]);
  }, []);

  const hasData = v2Data || v3Data;
  const hasDaySelected = selectedV2Day || selectedV3Day;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1400 }}>
      {/* Header */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          V2-V3 Aeris Cache Statistics Comparison
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Compare Aeris cache statistics between v2 (.log) and v3 (.json) log files on a per-day,
          per-hour basis.
        </Typography>
      </Box>

      {/* File Uploads - Side by Side */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'primary.light',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 0.75,
              display: 'block',
            }}
          >
            V2 Log File
          </Typography>
          <LogUploader<V2LogEntry[]>
            onDataLoaded={handleV2Loaded}
            parse={parseV2Log}
            validate={isValidV2Data}
            label="Upload V2 cache statistics (.log)"
            accept=".log,.txt"
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 280 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'secondary.light',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 0.75,
              display: 'block',
            }}
          >
            V3 Log File
          </Typography>
          <JsonUploader<AerisLogEntry[]>
            onDataLoaded={handleV3Loaded}
            validate={isValidAerisData}
            label="Upload V3 cache statistics (.json)"
          />
        </Box>
      </Box>

      {/* Controls & Chart Area */}
      {hasData && (
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
                <TimezoneSelector value={timezone} onChange={setTimezone} />
                <DaySelector
                  v2Options={v2DayOptions}
                  v3Options={v3DayOptions}
                  selectedV2Day={selectedV2Day}
                  selectedV3Day={selectedV3Day}
                  onV2DayChange={setSelectedV2Day}
                  onV3DayChange={setSelectedV3Day}
                />
                <MetricSelector selected={selectedMetrics} onChange={setSelectedMetrics} />
              </Box>
            </Box>

            {/* Annotations */}
            <ChartAnnotations annotations={annotations} onChange={setAnnotations} />

            <Divider />

            {/* Comparison Chart & Table */}
            {hasDaySelected ? (
              <>
                <ComparisonChart
                  v2HourlyData={v2HourlyData}
                  v3HourlyData={v3HourlyData}
                  selectedMetrics={selectedMetrics}
                  annotations={annotations}
                />

                <ComparisonTable
                  v2HourlyData={v2HourlyData}
                  v3HourlyData={v3HourlyData}
                  selectedMetrics={selectedMetrics}
                  v2DayLabel={selectedV2Day}
                  v3DayLabel={selectedV3Day}
                />
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 6,
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Select a day from V2 and/or V3 above to see the comparison
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Empty State */}
      {!hasData && (
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
            Upload V2 and V3 log files to begin comparison
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 480, textAlign: 'center' }}>
            Upload a V2 .log file (text format with clusterStats blocks) and a V3 .json file
            (array of Aeris cache statistics entries) to compare cache performance across versions.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
