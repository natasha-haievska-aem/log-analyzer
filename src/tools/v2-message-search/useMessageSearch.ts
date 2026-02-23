import { useMemo } from 'react';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { searchMessages } from './parseV2Messages';
import type { V2MessageLine, HourlyGroup, SearchResult, TableRow } from '../../types/v2-message-search';

/**
 * Groups matched V2 log lines into hourly buckets per pattern,
 * using the selected display timezone.
 */
function groupByHour(
  entries: V2MessageLine[],
  timezone: string
): HourlyGroup[] {
  const groups = new Map<string, HourlyGroup>();

  for (const entry of entries) {
    const zonedDate = toZonedTime(entry.timestamp, timezone);
    const dateStr = format(zonedDate, 'yyyy-MM-dd');
    const hour = zonedDate.getHours();
    const key = `${dateStr}-${hour}`;

    if (!groups.has(key)) {
      groups.set(key, {
        date: dateStr,
        hour,
        count: 0,
        entries: [],
      });
    }

    const group = groups.get(key)!;
    group.count++;
    group.entries.push(entry);
  }

  // Sort entries within each group by timestamp
  for (const group of groups.values()) {
    group.entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Sort groups by date + hour
  return Array.from(groups.values()).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    return dateCompare !== 0 ? dateCompare : a.hour - b.hour;
  });
}

/**
 * Custom hook that performs message searching and hourly grouping.
 */
export function useMessageSearch(
  allLines: V2MessageLine[] | null,
  patterns: string[],
  timezone: string
): {
  results: SearchResult[];
  timeOrderedRows: TableRow[];
} {
  return useMemo(() => {
    if (!allLines || allLines.length === 0 || patterns.length === 0) {
      return { results: [], timeOrderedRows: [] };
    }

    const matchesMap = searchMessages(allLines, patterns);
    const results: SearchResult[] = [];
    const allRows: TableRow[] = [];

    for (const pattern of patterns) {
      const matches = matchesMap.get(pattern) ?? [];
      const hourlyGroups = groupByHour(matches, timezone);

      results.push({
        pattern,
        hourlyGroups,
        totalCount: matches.length,
      });

      // Flatten groups into table rows
      for (const group of hourlyGroups) {
        allRows.push({
          date: group.date,
          hour: group.hour,
          pattern,
          count: group.count,
          entries: group.entries,
        });
      }
    }

    // Sort all rows by date + hour (ascending), with tiebreaker by earliest entry timestamp
    const timeOrderedRows = allRows.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      if (a.hour !== b.hour) return a.hour - b.hour;
      // Same date+hour: sort by earliest entry timestamp
      const aFirst = a.entries[0]?.timestamp.getTime() ?? 0;
      const bFirst = b.entries[0]?.timestamp.getTime() ?? 0;
      return aFirst - bFirst;
    });

    return { results, timeOrderedRows };
  }, [allLines, patterns, timezone]);
}
