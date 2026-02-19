import React from 'react';
import AerisCacheTool from './aeris-cache/AerisCacheTool';
import AerisComparisonTool from './aeris-comparison/AerisComparisonTool';
import BarChartIcon from '@mui/icons-material/BarChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

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
  {
    id: 'aeris-comparison',
    label: 'V2-V3 Cache Comparison',
    icon: React.createElement(CompareArrowsIcon),
    component: AerisComparisonTool,
  },
];
