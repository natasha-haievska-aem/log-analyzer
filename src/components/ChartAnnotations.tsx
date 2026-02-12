import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Popover,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import type { ChartAnnotation } from '../types/aeris';

interface ChartAnnotationsProps {
  annotations: ChartAnnotation[];
  onChange: (annotations: ChartAnnotation[]) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#10b981', '#6366f1', '#14b8a6', '#e11d48',
  '#a855f7', '#eab308', '#64748b', '#ffffff',
];

const DEFAULT_COLORS: Record<ChartAnnotation['type'], string> = {
  yaxis: '#f59e0b',
  xaxis: '#8b5cf6',
  point: '#ef4444',
};

function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          border: '2px solid',
          borderColor: 'divider',
          backgroundColor: color,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'box-shadow 0.15s',
          '&:hover': { boxShadow: `0 0 0 2px ${color}44` },
        }}
      />
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1.5, backgroundColor: '#1e1e2e', border: '1px solid', borderColor: 'divider' } } }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
          {PRESET_COLORS.map((c) => (
            <Box
              key={c}
              onClick={() => { onChange(c); setAnchorEl(null); }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                backgroundColor: c,
                cursor: 'pointer',
                border: c === color ? '2px solid white' : '2px solid transparent',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.2)' },
              }}
            />
          ))}
        </Box>
        <TextField
          value={color}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          sx={{ mt: 1, width: '100%' }}
          placeholder="#hex"
          inputProps={{ style: { fontSize: '0.75rem', fontFamily: 'monospace' } }}
        />
      </Popover>
    </>
  );
}

function EditableAnnotation({
  annotation,
  onSave,
  onCancel,
}: {
  annotation: ChartAnnotation;
  onSave: (updated: ChartAnnotation) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(annotation.label);
  const [color, setColor] = useState(annotation.color);
  const [yValue, setYValue] = useState(annotation.y?.toString() ?? '');
  const [xDate, setXDate] = useState<Date | null>(
    annotation.x != null ? new Date(annotation.x) : null
  );

  const handleSave = () => {
    const updated: ChartAnnotation = {
      ...annotation,
      label,
      color,
    };
    if (annotation.type === 'yaxis' || annotation.type === 'point') {
      updated.y = Number(yValue);
    }
    if (annotation.type === 'xaxis' || annotation.type === 'point') {
      updated.x = xDate ? xDate.getTime() : annotation.x;
    }
    onSave(updated);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: 1,
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid',
          borderColor: 'primary.main',
          flexWrap: 'wrap',
        }}
      >
        <ColorPicker color={color} onChange={setColor} />

        {(annotation.type === 'xaxis' || annotation.type === 'point') && (
          <DateTimePicker
            value={xDate}
            onChange={setXDate}
            slotProps={{
              textField: { size: 'small', sx: { minWidth: 190, maxWidth: 220 } },
            }}
            ampm={false}
            format="yyyy-MM-dd HH:mm"
          />
        )}

        {(annotation.type === 'yaxis' || annotation.type === 'point') && (
          <TextField
            value={yValue}
            onChange={(e) => setYValue(e.target.value)}
            placeholder="Y"
            type="number"
            size="small"
            sx={{ width: 90 }}
          />
        )}

        <TextField
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          size="small"
          sx={{ minWidth: 120, flex: 1 }}
        />

        <IconButton size="small" onClick={handleSave} color="success" sx={{ p: 0.5 }}>
          <CheckIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onCancel} color="error" sx={{ p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </LocalizationProvider>
  );
}

export default function ChartAnnotations({ annotations, onChange }: ChartAnnotationsProps) {
  const [type, setType] = useState<ChartAnnotation['type']>('yaxis');
  const [yValue, setYValue] = useState('');
  const [xDate, setXDate] = useState<Date | null>(null);
  const [pointX, setPointX] = useState<Date | null>(null);
  const [pointY, setPointY] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS.yaxis);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canAdd =
    type === 'yaxis'
      ? !!yValue
      : type === 'xaxis'
        ? !!xDate
        : !!pointX && !!pointY;

  const handleTypeChange = (newType: ChartAnnotation['type']) => {
    setType(newType);
    setColor(DEFAULT_COLORS[newType]);
  };

  const handleAdd = useCallback(() => {
    if (!canAdd) return;

    let newAnnotation: ChartAnnotation;

    if (type === 'yaxis') {
      newAnnotation = {
        id: `ann-${Date.now()}`,
        type,
        label: label || `H-Line @ ${yValue}`,
        y: Number(yValue),
        color,
      };
    } else if (type === 'xaxis') {
      const ts = xDate!.getTime();
      newAnnotation = {
        id: `ann-${Date.now()}`,
        type,
        label: label || `V-Line @ ${format(xDate!, 'yyyy-MM-dd HH:mm')}`,
        x: ts,
        color,
      };
    } else {
      const ts = pointX!.getTime();
      newAnnotation = {
        id: `ann-${Date.now()}`,
        type,
        label: label || `Point @ ${format(pointX!, 'MM-dd HH:mm')}, ${pointY}`,
        x: ts,
        y: Number(pointY),
        color,
      };
    }

    onChange([...annotations, newAnnotation]);
    setYValue('');
    setXDate(null);
    setPointX(null);
    setPointY('');
    setLabel('');
  }, [type, yValue, xDate, pointX, pointY, label, color, annotations, onChange, canAdd]);

  const handleRemove = useCallback(
    (id: string) => {
      onChange(annotations.filter((a) => a.id !== id));
    },
    [annotations, onChange]
  );

  const handleSaveEdit = useCallback(
    (updated: ChartAnnotation) => {
      onChange(annotations.map((a) => (a.id === updated.id ? updated : a)));
      setEditingId(null);
    },
    [annotations, onChange]
  );

  const formatAnnotationDisplay = (ann: ChartAnnotation) => {
    const parts: string[] = [];
    if (ann.y !== undefined) parts.push(`Y: ${ann.y}`);
    if (ann.x !== undefined) {
      const xVal =
        typeof ann.x === 'number'
          ? format(new Date(ann.x), 'yyyy-MM-dd HH:mm')
          : String(ann.x);
      parts.push(`X: ${xVal}`);
    }
    return parts.length > 0 ? `${ann.label} · ${parts.join(', ')}` : ann.label;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Accordion
        disableGutters
        sx={{
          backgroundColor: 'rgba(30, 30, 46, 0.5)',
          border: '1px solid',
          borderColor: 'divider',
          '&:before': { display: 'none' },
          borderRadius: '8px !important',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Annotations
            </Typography>
            {annotations.length > 0 && (
              <Chip
                label={annotations.length}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack spacing={1.5}>
            {/* Add new annotation */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as ChartAnnotation['type'])}
                size="small"
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="yaxis">H-Line (Y)</MenuItem>
                <MenuItem value="xaxis">V-Line (X)</MenuItem>
                <MenuItem value="point">Point (X,Y)</MenuItem>
              </Select>

              <ColorPicker color={color} onChange={setColor} />

              {type === 'yaxis' && (
                <TextField
                  value={yValue}
                  onChange={(e) => setYValue(e.target.value)}
                  placeholder="Y value"
                  type="number"
                  size="small"
                  sx={{ minWidth: 120 }}
                />
              )}

              {type === 'xaxis' && (
                <DateTimePicker
                  value={xDate}
                  onChange={setXDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 220 },
                      placeholder: 'Select date/time',
                    },
                  }}
                  ampm={false}
                  format="yyyy-MM-dd HH:mm"
                />
              )}

              {type === 'point' && (
                <>
                  <DateTimePicker
                    value={pointX}
                    onChange={setPointX}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 200 },
                        placeholder: 'X (date/time)',
                      },
                    }}
                    ampm={false}
                    format="yyyy-MM-dd HH:mm"
                  />
                  <TextField
                    value={pointY}
                    onChange={(e) => setPointY(e.target.value)}
                    placeholder="Y value"
                    type="number"
                    size="small"
                    sx={{ minWidth: 100 }}
                  />
                </>
              )}

              <TextField
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optional)"
                size="small"
                sx={{ minWidth: 140 }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={!canAdd}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add
              </Button>
            </Box>

            {/* List of existing annotations */}
            {annotations.length > 0 && (
              <Stack spacing={0.5}>
                {annotations.map((ann) =>
                  editingId === ann.id ? (
                    <EditableAnnotation
                      key={ann.id}
                      annotation={ann}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <Box
                      key={ann.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '3px',
                          backgroundColor: ann.color,
                          flexShrink: 0,
                        }}
                      />
                      <Chip
                        label={ann.type === 'yaxis' ? 'H' : ann.type === 'xaxis' ? 'V' : 'P'}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                      <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>
                        {formatAnnotationDisplay(ann)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setEditingId(ann.id)}
                        sx={{ p: 0.25 }}
                      >
                        <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(ann.id)}
                        sx={{ p: 0.25 }}
                      >
                        <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )
                )}
              </Stack>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </LocalizationProvider>
  );
}
