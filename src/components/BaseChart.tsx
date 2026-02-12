import { useId } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Box, useTheme } from '@mui/material';
import type { ApexOptions } from 'apexcharts';
import type { ChartAnnotation } from '../types/aeris';

interface BaseChartProps {
  series: ApexAxisChartSeries;
  options?: Partial<ApexOptions>;
  height?: number | string;
  annotations?: ChartAnnotation[];
  type?: 'line' | 'area' | 'bar';
  id?: string;
}

export default function BaseChart({
  series,
  options: customOptions = {},
  height = 350,
  annotations = [],
  type = 'line',
  id,
}: BaseChartProps) {
  const theme = useTheme();
  const generatedId = useId();

  const annotationConfig: ApexOptions['annotations'] = {
    yaxis: annotations
      .filter((a) => a.type === 'yaxis')
      .map((a) => ({
        y: a.y!,
        borderColor: a.color,
        strokeDashArray: 4,
        label: {
          text: a.label,
          borderColor: a.color,
          style: {
            color: '#fff',
            background: a.color,
            fontSize: '11px',
          },
        },
      })),
    xaxis: annotations
      .filter((a) => a.type === 'xaxis')
      .map((a) => ({
        x: typeof a.x === 'string' ? new Date(a.x).getTime() : a.x!,
        borderColor: a.color,
        strokeDashArray: 4,
        label: {
          text: a.label,
          borderColor: a.color,
          style: {
            color: '#fff',
            background: a.color,
            fontSize: '11px',
          },
        },
      })),
    points: annotations
      .filter((a) => a.type === 'point')
      .map((a) => ({
        x: typeof a.x === 'string' ? new Date(a.x).getTime() : a.x!,
        y: a.y!,
        marker: {
          size: 6,
          fillColor: a.color,
          strokeColor: a.color,
        },
        label: {
          text: a.label,
          borderColor: a.color,
          style: {
            color: '#fff',
            background: a.color,
            fontSize: '11px',
          },
        },
      })),
  };

  // Build defaults first, then properly deep-merge custom options
  const chartDefaults = {
    id: id || `chart-${generatedId}`,
    type,
    background: 'transparent',
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
    },
    zoom: {
      enabled: true,
      type: 'x' as const,
      autoScaleYaxis: true,
    },
    animations: {
      enabled: true,
      speed: 400,
      dynamicAnimation: { enabled: true, speed: 200 },
    },
    ...customOptions.chart,
  };

  const defaultLabels = {
    style: {
      colors: theme.palette.text.secondary,
      fontSize: '11px',
    },
    datetimeUTC: false,
    datetimeFormatter: {
      year: 'yyyy',
      month: "MMM 'yy",
      day: 'dd MMM',
      hour: 'HH:mm',
      minute: 'HH:mm:ss',
    },
  };

  const { labels: customLabels, ...restXaxis } = customOptions.xaxis || {};

  const xaxisMerged = {
    type: 'datetime' as const,
    labels: { ...defaultLabels, ...customLabels },
    axisBorder: { color: theme.palette.divider },
    axisTicks: { color: theme.palette.divider },
    ...restXaxis,
  };

  const yaxisDefaults = {
    labels: {
      style: {
        colors: theme.palette.text.secondary,
        fontSize: '11px',
      },
      formatter: (val: number) => {
        if (val === undefined || val === null) return '';
        return val.toFixed(0);
      },
    },
    ...(customOptions.yaxis && !Array.isArray(customOptions.yaxis) ? customOptions.yaxis : {}),
  };

  const defaultOptions: ApexOptions = {
    chart: chartDefaults,
    theme: {
      mode: 'dark',
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    stroke: {
      curve: 'smooth',
      width: 2.5,
    },
    xaxis: xaxisMerged,
    yaxis: yaxisDefaults,
    tooltip: {
      theme: 'dark',
      x: {
        format: 'yyyy-MM-dd HH:mm:ss',
      },
      ...customOptions.tooltip,
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      fontWeight: 500,
      labels: {
        colors: theme.palette.text.primary,
      },
      itemMargin: { horizontal: 12, vertical: 4 },
      ...customOptions.legend,
    },
    dataLabels: {
      enabled: false,
    },
    ...(customOptions.markers ? { markers: customOptions.markers } : {}),
    annotations: annotationConfig,
  };

  return (
    <Box sx={{ width: '100%', '.apexcharts-canvas': { background: 'transparent !important' } }}>
      <ReactApexChart
        options={defaultOptions}
        series={series}
        type={type}
        height={height}
      />
    </Box>
  );
}
