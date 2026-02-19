import { fromZonedTime } from 'date-fns-tz';
import type { AerisCacheStats } from '../../types/aeris';
import type { V2LogEntry } from '../../types/aeris-comparison';

/** V2 logs are always in America/New_York timezone */
const V2_TIMEZONE = 'America/New_York';

/**
 * Parses a v2 `.log` file containing `clusterStats after CacheStuffing` blocks.
 *
 * Example block:
 * ```
 * Feb 16 00:57:52 ip-172-30-0-166 node[3629451]: wwa:business-cron clusterStats after CacheStuffing: {
 * Feb 16 00:57:52 ip-172-30-0-166 node[3629451]:   hits: 6467,
 * ...
 * Feb 16 00:57:52 ip-172-30-0-166 node[3629451]: }
 * ```
 */
export function parseV2Log(text: string): V2LogEntry[] {
  const entries: V2LogEntry[] = [];
  const lines = text.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for the header line: "clusterStats after CacheStuffing: {"
    if (line.includes('clusterStats after CacheStuffing:')) {
      const timestamp = extractTimestamp(line);
      if (!timestamp) {
        i++;
        continue;
      }

      // Accumulate key-value lines until we find the closing "}"
      const kvLines: string[] = [];
      i++; // Move past the header line

      while (i < lines.length) {
        const currentLine = lines[i];
        // Check for closing brace (the line ends with "}" after the log prefix)
        if (currentLine.match(/\}\s*$/)) {
          break;
        }
        kvLines.push(currentLine);
        i++;
      }

      const stats = parseStatsBlock(kvLines);
      if (stats) {
        entries.push({ timestamp, stats });
      }
    }

    i++;
  }

  return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Extracts a UTC Date from a v2 log line prefix: "Feb 16 00:57:52 ..."
 * V2 timestamps are in America/New_York. We convert to UTC for consistent handling.
 * Year is inferred from the current year (v2 logs don't include year).
 */
function extractTimestamp(line: string): Date | null {
  const match = line.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/
  );
  if (!match) return null;

  const [, monthStr, day, hour, minute, second] = match;
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const month = monthMap[monthStr];
  if (month === undefined) return null;

  const year = new Date().getFullYear();

  // fromZonedTime interprets the ISO string as if it were in the given timezone
  // and returns the equivalent UTC Date
  return fromZonedTime(
    `${year}-${String(month + 1).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}T${hour}:${minute}:${second}`,
    V2_TIMEZONE
  );
}

/**
 * Parses key-value pairs from the stats block lines.
 * Lines look like: "Feb 16 00:57:52 ip-... node[...]:   hits: 6467,"
 */
function parseStatsBlock(lines: string[]): AerisCacheStats | null {
  const stats: Record<string, number> = {};

  for (const line of lines) {
    // Extract "key: value" pattern after the log prefix
    const match = line.match(/:\s+([\w]+):\s+(\d+)/);
    if (match) {
      const [, key, value] = match;
      stats[key] = parseInt(value, 10);
    }
  }

  // Validate we have the required fields (at minimum hits and misses)
  if (stats.hits === undefined || stats.misses === undefined) {
    return null;
  }

  return {
    hits: stats.hits ?? 0,
    misses: stats.misses ?? 0,
    cacheDeferredHits: stats.cacheDeferredHits ?? 0,
    aerisCalls: stats.aerisCalls ?? 0,
    aerisAlertsCalls: stats.aerisAlertsCalls ?? 0,
    aerisForecastsCalls: stats.aerisForecastsCalls ?? 0,
    aerisAirQualityIndexCalls: stats.aerisAirQualityIndexCalls ?? 0,
  };
}
