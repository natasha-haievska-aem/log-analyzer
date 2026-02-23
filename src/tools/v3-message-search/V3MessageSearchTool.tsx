import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  Divider,
  Fade,
  Paper,
  InputAdornment,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import JsonUploader from '../../components/JsonUploader';
import TimezoneSelector from '../../components/TimezoneSelector';
import MessageSearchTable from '../v2-message-search/MessageSearchTable';
import { parseV3Lines } from './parseV3Messages';
import { useMessageSearch } from '../v2-message-search/useMessageSearch';
import type { V2MessageLine } from '../../types/v2-message-search';

function isValidJsonArray(data: unknown): data is unknown[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  const first = data[0];
  return (
    typeof first === 'object' &&
    first !== null &&
    '@timestamp' in first &&
    '@message' in first
  );
}

export default function V3MessageSearchTool() {
  const [logData, setLogData] = useState<V2MessageLine[] | null>(null);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleDataLoaded = useCallback((data: unknown) => {
    const parsed = parseV3Lines(data);
    if (parsed.length === 0) return;
    setLogData(parsed);
    setPatterns([]);
    setInputValue('');
  }, []);

  const handleAddPattern = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !patterns.includes(trimmed)) {
      setPatterns((prev) => [...prev, trimmed]);
      setInputValue('');
    }
  }, [inputValue, patterns]);

  const handleRemovePattern = useCallback((pattern: string) => {
    setPatterns((prev) => prev.filter((p) => p !== pattern));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddPattern();
      }
    },
    [handleAddPattern]
  );

  const stablePatterns = useMemo(() => patterns, [patterns]);
  const { results, timeOrderedRows } = useMessageSearch(logData, stablePatterns, timezone);
  const entryCount = logData?.length ?? 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1400 }}>
      {/* Header */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          V3 Message Search
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Search for specific messages in V3 .json log files and analyze their hourly frequency.
        </Typography>
      </Box>

      {/* File Upload */}
      <JsonUploader<unknown[]>
        onDataLoaded={handleDataLoaded}
        validate={isValidJsonArray}
        label="Upload V3 log file (.json)"
      />

      {/* Controls & Results */}
      {logData && (
        <Fade in>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {entryCount.toLocaleString()} log entries parsed
            </Typography>

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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  flex: 1,
                  minWidth: 300,
                }}
              >
                <TimezoneSelector value={timezone} onChange={setTimezone} />

                {/* Search pattern input */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      mb: 0.75,
                      display: 'block',
                      fontSize: '0.65rem',
                    }}
                  >
                    Search Patterns
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter message substring to search…"
                      size="small"
                      fullWidth
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={handleAddPattern}
                                disabled={!inputValue.trim()}
                                color="primary"
                              >
                                <AddCircleOutlineIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                          sx: {
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Active patterns */}
                  {patterns.length > 0 && (
                    <Paper
                      variant="outlined"
                      sx={{
                        mt: 1,
                        p: 1,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.75,
                        backgroundColor: 'rgba(17, 17, 27, 0.4)',
                      }}
                    >
                      {patterns.map((pattern, idx) => (
                        <Chip
                          key={pattern}
                          label={pattern.length > 80 ? pattern.slice(0, 80) + '…' : pattern}
                          title={pattern}
                          onDelete={() => handleRemovePattern(pattern)}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            maxWidth: 500,
                            backgroundColor: `${getChipColor(idx)}22`,
                            color: getChipColor(idx),
                            '& .MuiChip-deleteIcon': {
                              color: `${getChipColor(idx)}88`,
                              '&:hover': { color: getChipColor(idx) },
                            },
                          }}
                        />
                      ))}
                    </Paper>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Results */}
            {patterns.length > 0 ? (
              <MessageSearchTable
                results={results}
                timeOrderedRows={timeOrderedRows}
                timezone={timezone}
                patterns={patterns}
              />
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
                  Add a search pattern above to find matching messages
                </Typography>
              </Box>
            )}

            {/* No results state */}
            {patterns.length > 0 && timeOrderedRows.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 4,
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  No matches found for the specified patterns
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Empty State */}
      {!logData && (
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
            Upload a V3 JSON log file to begin searching
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', maxWidth: 480, textAlign: 'center' }}
          >
            Upload a V3 .json file (array of log entries with @timestamp and @message) to search
            for specific messages and analyze their hourly frequency distribution.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

const CHIP_COLORS = [
  '#818cf8', '#f472b6', '#34d399', '#fbbf24',
  '#60a5fa', '#a78bfa', '#fb923c', '#2dd4bf',
];

function getChipColor(index: number): string {
  return CHIP_COLORS[index % CHIP_COLORS.length];
}
