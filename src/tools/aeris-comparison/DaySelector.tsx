import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import type { ComparisonDayOption } from '../../types/aeris-comparison';

interface DaySelectorProps {
  v2Options: ComparisonDayOption[];
  v3Options: ComparisonDayOption[];
  selectedV2Day: string | null;
  selectedV3Day: string | null;
  onV2DayChange: (day: string) => void;
  onV3DayChange: (day: string) => void;
}

export default function DaySelector({
  v2Options,
  v3Options,
  selectedV2Day,
  selectedV3Day,
  onV2DayChange,
  onV3DayChange,
}: DaySelectorProps) {
  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* V2 Day Selector */}
      <Box sx={{ flex: 1, minWidth: 240 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'primary.light',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 0.5,
            display: 'block',
          }}
        >
          V2 Log
        </Typography>
        <FormControl size="small" fullWidth disabled={v2Options.length === 0}>
          <InputLabel>Select Day</InputLabel>
          <Select
            value={selectedV2Day ?? ''}
            label="Select Day"
            onChange={(e) => onV2DayChange(e.target.value)}
          >
            {v2Options.map((opt) => (
              <MenuItem key={opt.dayKey} value={opt.dayKey}>
                {opt.displayLabel} ({opt.entryCount} entries)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* V3 Day Selector */}
      <Box sx={{ flex: 1, minWidth: 240 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'secondary.light',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 0.5,
            display: 'block',
          }}
        >
          V3 Log
        </Typography>
        <FormControl size="small" fullWidth disabled={v3Options.length === 0}>
          <InputLabel>Select Day</InputLabel>
          <Select
            value={selectedV3Day ?? ''}
            label="Select Day"
            onChange={(e) => onV3DayChange(e.target.value)}
          >
            {v3Options.map((opt) => (
              <MenuItem key={opt.dayKey} value={opt.dayKey}>
                {opt.displayLabel} ({opt.entryCount} entries)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
