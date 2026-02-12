import { Box } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DateTimeRangePickerProps {
  start: Date | null;
  end: Date | null;
  onStartChange: (date: Date | null) => void;
  onEndChange: (date: Date | null) => void;
}

export default function DateTimeRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
}: DateTimeRangePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <DateTimePicker
          label="Start"
          value={start}
          onChange={onStartChange}
          slotProps={{
            textField: { size: 'small', sx: { minWidth: 210 } },
          }}
          ampm={false}
          format="yyyy-MM-dd HH:mm"
        />
        <DateTimePicker
          label="End"
          value={end}
          onChange={onEndChange}
          slotProps={{
            textField: { size: 'small', sx: { minWidth: 210 } },
          }}
          ampm={false}
          format="yyyy-MM-dd HH:mm"
        />
      </Box>
    </LocalizationProvider>
  );
}
