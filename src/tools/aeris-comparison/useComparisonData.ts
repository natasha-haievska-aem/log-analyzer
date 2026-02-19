import { useMemo } from 'react';
import { format, getHours, getMinutes, subDays } from 'date-fns';
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

  // Build hourly data for selected days (including prev-day entries for midnight)
  const v2HourlyData = useMemo((): (HourlyEntry | null)[] => {
    if (!selectedV2Day) return new Array(24).fill(null);
    const dayEntries = v2DayGroups.get(selectedV2Day);
    if (!dayEntries) return new Array(24).fill(null);
    const prevDayEntries = getPrevDayEntries(selectedV2Day, v2DayGroups);
    return buildHourlyData(dayEntries, timezone, prevDayEntries);
  }, [selectedV2Day, v2DayGroups, timezone]);

  const v3HourlyData = useMemo((): (HourlyEntry | null)[] => {
    if (!selectedV3Day) return new Array(24).fill(null);
    const dayEntries = v3DayGroups.get(selectedV3Day);
    if (!dayEntries) return new Array(24).fill(null);
    const prevDayEntries = getPrevDayEntries(selectedV3Day, v3DayGroups);
    return buildHourlyData(dayEntries, timezone, prevDayEntries);
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
 * Returns entries from the previous calendar day (for midnight matching).
 */
function getPrevDayEntries(
  dayKey: string,
  dayGroups: Map<string, TimestampedEntry[]>
): TimestampedEntry[] {
  const currentDate = new Date(dayKey + 'T12:00:00'); // noon to avoid DST issues
  const prevDate = subDays(currentDate, 1);
  const prevDayKey = format(prevDate, 'yyyy-MM-dd');
  return dayGroups.get(prevDayKey) ?? [];
}

/**
 * For each hour 0–23, finds the nearest entry within ±30 minutes.
 * For hour 0 (midnight), also considers late entries (23:30+) from the previous day.
 * Same-day entries use linear distance; previous-day entries use cross-midnight distance.
 * Returns an array of 24 elements (null if no entry found for that hour).
 */
function buildHourlyData(
  entries: TimestampedEntry[],
  timezone: string,
  prevDayEntries: TimestampedEntry[] = []
): (HourlyEntry | null)[] {
  const windowMinutes = 30;
  const result: (HourlyEntry | null)[] = new Array(24).fill(null);

  for (let hour = 0; hour < 24; hour++) {
    const targetMinutes = hour * 60;
    let bestEntry: TimestampedEntry | null = null;
    let bestDistance = Infinity;

    // Same-day entries: linear distance only (no circular wrapping)
    for (const entry of entries) {
      const zonedTime = toZonedTime(entry.timestamp, timezone);
      const entryMinutes = getHours(zonedTime) * 60 + getMinutes(zonedTime);
      const distance = Math.abs(entryMinutes - targetMinutes);

      if (distance <= windowMinutes && distance < bestDistance) {
        bestDistance = distance;
        bestEntry = entry;
      }
    }

    // For hour 0, also check previous day's late entries (cross-midnight distance)
    if (hour === 0) {
      for (const entry of prevDayEntries) {
        const zonedTime = toZonedTime(entry.timestamp, timezone);
        const entryMinutes = getHours(zonedTime) * 60 + getMinutes(zonedTime);
        // Distance from midnight: e.g. 23:45 → 1440 - 1425 = 15 min
        const distance = 1440 - entryMinutes;

        if (distance <= windowMinutes && distance < bestDistance) {
          bestDistance = distance;
          bestEntry = entry;
        }
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
