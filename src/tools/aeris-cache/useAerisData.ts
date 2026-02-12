import { useMemo, useCallback } from 'react';
import { toZonedTime } from 'date-fns-tz';
import { getHours, getMinutes, format } from 'date-fns';
import type { AerisLogEntry, AerisCacheStats } from '../../types/aeris';

export interface ParsedEntry {
  timestamp: Date;       // Original UTC timestamp
  zonedTime: Date;       // Timestamp in selected timezone
  stats: AerisCacheStats;
  runId: string;
  hostname: string;
}

export function useAerisData(
  rawData: AerisLogEntry[] | null,
  timezone: string,
  startDate: Date | null,
  endDate: Date | null
) {
  const parsedData = useMemo(() => {
    if (!rawData) return [];

    return rawData
      .filter((entry) => entry['@message']?.aerisCacheStats)
      .map((entry): ParsedEntry => {
        const ts = new Date(entry['@timestamp'].replace(' ', 'T') + 'Z');
        return {
          timestamp: ts,
          zonedTime: toZonedTime(ts, timezone),
          stats: entry['@message'].aerisCacheStats,
          runId: entry['@message'].runId,
          hostname: entry['@message'].hostname,
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [rawData, timezone]);

  const filteredData = useMemo(() => {
    if (!parsedData.length) return [];
    if (!startDate && !endDate) return parsedData;

    return parsedData.filter((entry) => {
      const entryZoned = entry.zonedTime;
      if (startDate && entryZoned < startDate) return false;
      if (endDate && entryZoned > endDate) return false;
      return true;
    });
  }, [parsedData, startDate, endDate]);

  const dateRange = useMemo(() => {
    if (!parsedData.length) return { min: null, max: null };
    return {
      min: parsedData[0].zonedTime,
      max: parsedData[parsedData.length - 1].zonedTime,
    };
  }, [parsedData]);

  const groupByDay = useCallback(
    (data: ParsedEntry[]): Map<string, ParsedEntry[]> => {
      const groups = new Map<string, ParsedEntry[]>();
      data.forEach((entry) => {
        const dayKey = format(entry.zonedTime, 'yyyy-MM-dd');
        if (!groups.has(dayKey)) groups.set(dayKey, []);
        groups.get(dayKey)!.push(entry);
      });

      // Sort by day key  
      return new Map([...groups.entries()].sort());
    },
    []
  );

  const getNearestToHour = useCallback(
    (data: ParsedEntry[], hour: number, windowMinutes: number = 30): Map<string, ParsedEntry> => {
      const result = new Map<string, ParsedEntry>();
      const bestDistances = new Map<string, number>();

      const targetMinutes = hour * 60;

      data.forEach((entry) => {
        const entryHour = getHours(entry.zonedTime);
        const entryMinute = getMinutes(entry.zonedTime);
        const entryMinutes = entryHour * 60 + entryMinute;

        // Circular distance handles midnight wraparound
        // e.g. 23:45 is 15 minutes from 00:00, not 1425
        const rawDiff = entryMinutes - targetMinutes;
        const distance = Math.min(
          Math.abs(rawDiff),
          Math.abs(rawDiff + 1440),
          Math.abs(rawDiff - 1440)
        );

        if (distance > windowMinutes) return;

        // Determine which calendar day this entry belongs to for this target hour.
        // If the entry is from the late evening (e.g. 23:45) and we're looking for hour 0,
        // it should count toward the *next* day's data point.
        let dayKey = format(entry.zonedTime, 'yyyy-MM-dd');
        if (targetMinutes < windowMinutes && entryMinutes > 1440 - windowMinutes) {
          // Entry is late-night (e.g. 23:30+) but target is early morning (e.g. 00:00)
          // Assign to the next calendar day
          const nextDay = new Date(entry.zonedTime);
          nextDay.setDate(nextDay.getDate() + 1);
          dayKey = format(nextDay, 'yyyy-MM-dd');
        }

        const currentBest = bestDistances.get(dayKey) ?? Infinity;
        if (distance < currentBest) {
          bestDistances.set(dayKey, distance);
          result.set(dayKey, entry);
        }
      });

      return result;
    },
    []
  );

  const dailyData = useMemo(() => groupByDay(filteredData), [groupByDay, filteredData]);

  return {
    parsedData,
    filteredData,
    dateRange,
    dailyData,
    getNearestToHour,
  };
}
