import { fromZonedTime } from 'date-fns-tz';
import type { V2MessageLine } from '../../types/v2-message-search';

/** V2 logs are always in America/New_York timezone */
const V2_TIMEZONE = 'America/New_York';

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

  return fromZonedTime(
    `${year}-${String(month + 1).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}T${hour}:${minute}:${second}`,
    V2_TIMEZONE
  );
}

/**
 * Extracts the message portion from a V2 log line.
 * Lines look like: "Feb 16 00:57:52 ip-172-30-0-166 node[3629451]: wwa:business-cron message here"
 * We extract everything after the first ": " that follows the process info.
 */
function extractMessage(line: string): string {
  // Skip the timestamp + hostname + process parts, extract after "]: "
  const match = line.match(/\]: (.+)$/);
  return match ? match[1] : line;
}

/**
 * Parses all lines from a V2 .log file into timestamped message entries.
 * Returns only lines that have a valid parseable timestamp.
 */
export function parseV2Lines(text: string): V2MessageLine[] {
  const lines = text.split('\n');
  const entries: V2MessageLine[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const timestamp = extractTimestamp(line);
    if (!timestamp) continue;

    entries.push({
      timestamp,
      message: extractMessage(line),
    });
  }

  return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Searches parsed V2 log lines for entries whose message contains any of the given patterns.
 * Returns a Map from pattern → matching V2MessageLine[].
 */
export function searchMessages(
  entries: V2MessageLine[],
  patterns: string[]
): Map<string, V2MessageLine[]> {
  const results = new Map<string, V2MessageLine[]>();

  for (const pattern of patterns) {
    results.set(pattern, []);
  }

  for (const entry of entries) {
    for (const pattern of patterns) {
      if (entry.message.includes(pattern)) {
        results.get(pattern)!.push(entry);
      }
    }
  }

  return results;
}
