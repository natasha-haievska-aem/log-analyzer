import type { V2MessageLine } from '../../types/v2-message-search';

interface V3LogEntry {
  '@timestamp': string;
  '@message': {
    msg: string;
    [key: string]: unknown;
  };
}

/**
 * Parses a V3 JSON log file into timestamped message entries.
 * V3 logs are JSON arrays with `@timestamp` (UTC) and `@message` objects.
 * The searchable message text is the full JSON-stringified `@message`.
 */
export function parseV3Lines(jsonData: unknown): V2MessageLine[] {
  if (!Array.isArray(jsonData)) return [];

  const entries: V2MessageLine[] = [];

  for (const entry of jsonData as V3LogEntry[]) {
    if (!entry['@timestamp'] || !entry['@message']) continue;

    // V3 @timestamp is always UTC but lacks a 'Z' suffix — append it
    // so the Date constructor interprets it as UTC, not local time
    const rawTs = entry['@timestamp'].replace(' ', 'T');
    const timestamp = new Date(rawTs.endsWith('Z') ? rawTs : rawTs + 'Z');
    if (isNaN(timestamp.getTime())) continue;

    // Stringify the entire @message for searching, so users can match
    // any field within the message object
    const message = JSON.stringify(entry['@message']);

    entries.push({ timestamp, message });
  }

  return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
