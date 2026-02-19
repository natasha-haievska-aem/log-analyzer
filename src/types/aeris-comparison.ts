import type { AerisCacheStats } from './aeris';

export interface V2LogEntry {
  timestamp: Date;
  stats: AerisCacheStats;
}

export interface ComparisonDayOption {
  dayKey: string;        // e.g. "2026-02-16"
  displayLabel: string;  // e.g. "Feb 16, 2026"
  entryCount: number;
}

export interface HourlyEntry {
  hour: number;          // 0–23
  timestamp: Date;       // Original timestamp of the matched entry
  stats: AerisCacheStats;
}
