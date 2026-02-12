export interface AerisLogEntry {
  '@timestamp': string;
  '@message': {
    level: number;
    time: number;
    pid: number;
    hostname: string;
    msg: string;
    runId: string;
    aerisCacheStats: AerisCacheStats;
  };
}

export interface AerisCacheStats {
  hits: number;
  misses: number;
  cacheDeferredHits: number;
  aerisCalls: number;
  aerisAlertsCalls: number;
  aerisForecastsCalls: number;
  aerisAirQualityIndexCalls: number;
}

export const AERIS_METRIC_FIELDS: (keyof AerisCacheStats)[] = [
  'hits',
  'misses',
  'cacheDeferredHits',
  'aerisCalls',
  'aerisAlertsCalls',
  'aerisForecastsCalls',
  'aerisAirQualityIndexCalls',
];

export const METRIC_COLORS: Record<keyof AerisCacheStats, string> = {
  hits: '#22c55e',
  misses: '#ef4444',
  cacheDeferredHits: '#f59e0b',
  aerisCalls: '#3b82f6',
  aerisAlertsCalls: '#8b5cf6',
  aerisForecastsCalls: '#06b6d4',
  aerisAirQualityIndexCalls: '#ec4899',
};

export const METRIC_LABELS: Record<keyof AerisCacheStats, string> = {
  hits: 'Hits',
  misses: 'Misses',
  cacheDeferredHits: 'Deferred Hits',
  aerisCalls: 'Aeris Calls',
  aerisAlertsCalls: 'Alerts Calls',
  aerisForecastsCalls: 'Forecasts Calls',
  aerisAirQualityIndexCalls: 'Air Quality Calls',
};

export type PresentationMode = 'all' | 'daily' | 'hour';

export interface ChartAnnotation {
  id: string;
  type: 'point' | 'xaxis' | 'yaxis';
  x?: number | string;
  y?: number;
  label: string;
  color: string;
}
