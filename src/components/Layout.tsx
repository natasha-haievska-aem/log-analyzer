import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Tooltip,
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { tools } from '../tools/registry';

export default function Layout() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = tools[activeTab]?.component;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}
      >
        <InsightsIcon sx={{ fontSize: 28, color: 'primary.light' }} />
        <Typography
          variant="h5"
          sx={{
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          Log Analyzer
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5, mt: 0.5 }}>
          Client-side JSON log analysis
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 220,
            minWidth: 220,
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(17, 17, 27, 0.6)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              px: 2,
              pt: 2,
              pb: 1,
              color: 'text.secondary',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              fontWeight: 600,
            }}
          >
            Analysis Tools
          </Typography>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                alignItems: 'flex-start',
                px: 2,
                py: 1.5,
                minHeight: 48,
              },
            }}
          >
            {tools.map((tool) => (
              <Tab
                key={tool.id}
                icon={
                  <Tooltip title={tool.label} placement="right">
                    {tool.icon}
                  </Tooltip>
                }
                iconPosition="start"
                label={tool.label}
                sx={{
                  gap: 1.5,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            backgroundColor: 'rgba(17, 17, 27, 0.3)',
          }}
        >
          {ActiveComponent ? <ActiveComponent /> : null}
        </Box>
      </Box>
    </Box>
  );
}
