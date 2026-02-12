import { Box, Chip } from '@mui/material';
import { type AerisCacheStats, AERIS_METRIC_FIELDS, METRIC_COLORS, METRIC_LABELS } from '../types/aeris';

interface MetricSelectorProps {
  selected: (keyof AerisCacheStats)[];
  onChange: (selected: (keyof AerisCacheStats)[]) => void;
}

export default function MetricSelector({ selected, onChange }: MetricSelectorProps) {
  const handleToggle = (field: keyof AerisCacheStats) => {
    if (selected.includes(field)) {
      if (selected.length > 1) {
        onChange(selected.filter((f) => f !== field));
      }
    } else {
      onChange([...selected, field]);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {AERIS_METRIC_FIELDS.map((field) => {
        const isSelected = selected.includes(field);
        return (
          <Chip
            key={field}
            label={METRIC_LABELS[field]}
            size="small"
            onClick={() => handleToggle(field)}
            sx={{
              borderColor: METRIC_COLORS[field],
              color: isSelected ? '#fff' : METRIC_COLORS[field],
              backgroundColor: isSelected ? `${METRIC_COLORS[field]}33` : 'transparent',
              border: `1.5px solid ${METRIC_COLORS[field]}`,
              fontWeight: 500,
              fontSize: '0.75rem',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: `${METRIC_COLORS[field]}22`,
              },
            }}
          />
        );
      })}
    </Box>
  );
}
