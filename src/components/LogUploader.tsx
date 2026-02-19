import React, { useCallback, useRef, useState } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';

interface LogUploaderProps<T> {
  onDataLoaded: (data: T) => void;
  parse: (text: string) => T;
  validate?: (data: T) => boolean;
  label?: string;
  accept?: string;
}

function LogUploader<T>({
  onDataLoaded,
  parse,
  validate,
  label = 'Upload log file',
  accept = '.log',
}: LogUploaderProps<T>) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = parse(text);
          if (validate && !validate(parsed)) {
            setError('No valid data found in the file. Please check the format.');
            return;
          }
          setFileName(file.name);
          onDataLoaded(parsed);
        } catch {
          setError('Failed to parse log file');
        }
      };
      reader.readAsText(file);
    },
    [onDataLoaded, parse, validate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleClear = useCallback(() => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <Paper
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !fileName && inputRef.current?.click()}
      sx={{
        p: 2.5,
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : error ? 'error.main' : 'divider',
        borderRadius: 2,
        cursor: fileName ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        background: isDragging
          ? 'rgba(99, 102, 241, 0.08)'
          : 'rgba(30, 30, 46, 0.5)',
        '&:hover': fileName
          ? {}
          : {
              borderColor: 'primary.light',
              background: 'rgba(99, 102, 241, 0.05)',
            },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {fileName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InsertDriveFileIcon sx={{ color: 'primary.light', fontSize: 24 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Data loaded successfully
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, py: 1 }}>
          <CloudUploadIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Drag & drop or click to browse
          </Typography>
        </Box>
      )}

      {error && (
        <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
}

export default LogUploader;
