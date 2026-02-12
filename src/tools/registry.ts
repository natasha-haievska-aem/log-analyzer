import React from 'react';
import AerisCacheTool from './aeris-cache/AerisCacheTool';
import BarChartIcon from '@mui/icons-material/BarChart';

export interface ToolDefinition {
  id: string;
  label: string;
  icon: React.ReactElement;
  component: React.ComponentType;
}

export const tools: ToolDefinition[] = [
  {
    id: 'aeris-cache',
    label: 'Aeris Cache Statistics',
    icon: React.createElement(BarChartIcon),
    component: AerisCacheTool,
  },
];
