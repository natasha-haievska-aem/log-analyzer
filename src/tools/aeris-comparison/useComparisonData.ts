import { useMemo } from 'react';
import { format, getHours, getMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { AerisLogEntry, AerisCacheStats } from '../../types/aeris';
import type { V2LogEntry, ComparisonDayOption, HourlyEntry } from '../../types/aeris-comparison';

interface TimestampedEntry {
  timestamp: Date;       // UTC timestamp
  stats: AerisCacheStats;
}

/**
 * Hook that manages comparison data between v2 and v3 log entries.
 * Groups entries by day, provides day options, and builds hourly comparison data.
 */
export function useComparisonData(
  v2Data: V2LogEntry[] | null,
  v3Data: AerisLogEntry[] | null,
  selectedV2Day: string | null,
  selectedV3Day: string | null,
  timezone: string
) {
  // Parse v3 data into TimestampedEntry format
  const parsedV3 = useMemo((): TimestampedEntry[] => {
    if (!v3Data) return [];
    return v3Data
      .filter((entry) => entry['@message']?.aerisCacheStats)
      .map((entry) => {
        const ts = new Date(entry['@timestamp'].replace(' ', 'T') + 'Z');
        return {
          timestamp: ts,
          stats: entry['@message'].aerisCacheStats,
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [v3Data]);

  // Group v2 entries by day (v2 timestamps are already UTC after parsing)
  const v2DayGroups = useMemo(() => groupByDay(v2Data ?? [], timezone), [v2Data, timezone]);

  // Group v3 entries by day
  const v3DayGroups = useMemo(() => groupByDay(parsedV3, timezone), [parsedV3, timezone]);

  // Available day options for selectors
  const v2DayOptions = useMemo((): ComparisonDayOption[] => {
    return Array.from(v2DayGroups.entries()).map(([dayKey, entries]) => ({
      dayKey,
      displayLabel: formatDayLabel(dayKey),
      entryCount: entries.length,
    }));
  }, [v2DayGroups]);

  const v3DayOptions = useMemo((): ComparisonDayOption[] => {
    return Array.from(v3DayGroups.entries()).map(([dayKey, entries]) => ({
      dayKey,
      displayLabel: formatDayLabel(dayKey),
      entryCount: entries.length,
    }));
  }, [v3DayGroups]);

  // Build hourly data for selected days
  const v2HourlyData = useMemo((): (HourlyEntry | null)[] => {
    if (!selectedV2Day) return new Array(24).fill(null);
    const dayEntries = v2DayGroups.get(selectedV2Day);
    if (!dayEntries) return new Array(24).fill(null);
    return buildHourlyData(dayEntries, timezone);
  }, [selectedV2Day, v2DayGroups, timezone]);

  const v3HourlyData = useMemo((): (HourlyEntry | null)[] => {
    if (!selectedV3Day) return new Array(24).fill(null);
    const dayEntries = v3DayGroups.get(selectedV3Day);
    if (!dayEntries) return new Array(24).fill(null);
    return buildHourlyData(dayEntries, timezone);
  }, [selectedV3Day, v3DayGroups, timezone]);

  return {
    v2DayOptions,
    v3DayOptions,
    v2HourlyData,
    v3HourlyData,
  };
}


/**
 * Groups entries by calendar day in the given timezone.
 * Both v2 and v3 timestamps are UTC at this point.
 */
function groupByDay(
  entries: TimestampedEntry[],
  timezone: string
): Map<string, TimestampedEntry[]> {
  const groups = new Map<string, TimestampedEntry[]>();

  for (const entry of entries) {
    const zonedTime = toZonedTime(entry.timestamp, timezone);
    const dayKey = format(zonedTime, 'yyyy-MM-dd');

    if (!groups.has(dayKey)) groups.set(dayKey, []);
    groups.get(dayKey)!.push(entry);
  }

  return new Map([...groups.entries()].sort());
}

/**
 * Formats a day key like "2026-02-16" into a readable label.
 */
function formatDayLabel(dayKey: string): string {
  const date = new Date(dayKey + 'T00:00:00');
  return format(date, 'MMM dd, yyyy');
}

/**
 * For each hour 0–23, finds the nearest entry within ±30 minutes.
 * Returns an array of 24 elements (null if no entry found for that hour).
 */
function buildHourlyData(
  entries: TimestampedEntry[],
  timezone: string
): (HourlyEntry | null)[] {
  const windowMinutes = 30;
  const result: (HourlyEntry | null)[] = new Array(24).fill(null);

  for (let hour = 0; hour < 24; hour++) {
    const targetMinutes = hour * 60;
    let bestEntry: TimestampedEntry | null = null;
    let bestDistance = Infinity;

    for (const entry of entries) {
      const zonedTime = toZonedTime(entry.timestamp, timezone);

      const entryHour = getHours(zonedTime);
      const entryMinute = getMinutes(zonedTime);
      const entryMinutes = entryHour * 60 + entryMinute;

      // Circular distance for midnight handling
      const rawDiff = entryMinutes - targetMinutes;
      const distance = Math.min(
        Math.abs(rawDiff),
        Math.abs(rawDiff + 1440),
        Math.abs(rawDiff - 1440)
      );

      if (distance <= windowMinutes && distance < bestDistance) {
        bestDistance = distance;
        bestEntry = entry;
      }
    }

    if (bestEntry) {
      const zonedTime = toZonedTime(bestEntry.timestamp, timezone);

      result[hour] = {
        hour,
        timestamp: zonedTime,
        stats: bestEntry.stats,
      };
    }
  }

  return result;
}
