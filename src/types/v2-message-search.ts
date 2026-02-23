/** A single parsed line from a V2 .log file */
export interface V2MessageLine {
  timestamp: Date;
  /** The full message text after the syslog prefix */
  message: string;
}

/** A group of messages that occurred within the same hour on the same date */
export interface HourlyGroup {
  /** Calendar date string in display timezone, e.g. "2026-02-16" */
  date: string;
  /** Hour 0–23 in display timezone */
  hour: number;
  /** Number of occurrences */
  count: number;
  /** Individual matched entries (sorted by time) */
  entries: V2MessageLine[];
}

/** Results for a single search pattern */
export interface SearchResult {
  /** The search substring the user entered */
  pattern: string;
  /** Matches grouped by date+hour */
  hourlyGroups: HourlyGroup[];
  /** Total match count across all hours */
  totalCount: number;
}

/** A single row for the flattened results table */
export interface TableRow {
  date: string;
  hour: number;
  pattern: string;
  count: number;
  entries: V2MessageLine[];
}
