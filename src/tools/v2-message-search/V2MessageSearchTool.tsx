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
import LogUploader from '../../components/LogUploader';
import TimezoneSelector from '../../components/TimezoneSelector';
import MessageSearchTable from './MessageSearchTable';
import { parseV2Lines } from './parseV2Messages';
import { useMessageSearch } from './useMessageSearch';
import type { V2MessageLine } from '../../types/v2-message-search';

function parseLogFile(text: string): V2MessageLine[] {
  return parseV2Lines(text);
}

function validateLogData(data: V2MessageLine[]): boolean {
  return data.length > 0;
}

export default function V2MessageSearchTool() {
  const [logData, setLogData] = useState<V2MessageLine[] | null>(null);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleDataLoaded = useCallback((data: V2MessageLine[]) => {
    setLogData(data);
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

  // Memoize patterns array reference to avoid unnecessary recalculations
  const stablePatterns = useMemo(() => patterns, [patterns]);

  const { results, timeOrderedRows } = useMessageSearch(logData, stablePatterns, timezone);

  const entryCount = logData?.length ?? 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1400 }}>
      {/* Header */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          V2 Message Search
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Search for specific messages in V2 .log files and analyze their hourly frequency.
        </Typography>
      </Box>

      {/* File Upload */}
      <LogUploader<V2MessageLine[]>
        onDataLoaded={handleDataLoaded}
        parse={parseLogFile}
        validate={validateLogData}
        label="Upload V2 log file (.log, .txt)"
        accept=".log,.txt"
      />

      {/* Controls & Results */}
      {logData && (
        <Fade in>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Info */}
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {entryCount.toLocaleString()} log lines parsed
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
            Upload a V2 log file to begin searching
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', maxWidth: 480, textAlign: 'center' }}
          >
            Upload a V2 .log file (text format with syslog-style lines) to search for specific
            messages and analyze their hourly frequency distribution.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/** Color palette matching MessageSearchTable */
const CHIP_COLORS = [
  '#818cf8', '#f472b6', '#34d399', '#fbbf24',
  '#60a5fa', '#a78bfa', '#fb923c', '#2dd4bf',
];

function getChipColor(index: number): string {
  return CHIP_COLORS[index % CHIP_COLORS.length];
}
