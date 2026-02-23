import React from 'react';
import AerisCacheTool from './aeris-cache/AerisCacheTool';
import AerisComparisonTool from './aeris-comparison/AerisComparisonTool';
import V2MessageSearchTool from './v2-message-search/V2MessageSearchTool';
import V3MessageSearchTool from './v3-message-search/V3MessageSearchTool';
import BarChartIcon from '@mui/icons-material/BarChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SearchIcon from '@mui/icons-material/Search';
import FindInPageIcon from '@mui/icons-material/FindInPage';

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
  {
    id: 'v2-message-search',
    label: 'V2 Message Search',
    icon: React.createElement(SearchIcon),
    component: V2MessageSearchTool,
  },
  {
    id: 'v3-message-search',
    label: 'V3 Message Search',
    icon: React.createElement(FindInPageIcon),
    component: V3MessageSearchTool,
  },
];

