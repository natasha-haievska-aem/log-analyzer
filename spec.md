# Log Analyzer — Specification

## Overview

**Log Analyzer** is a fully **client-side** (browser-only) application for analyzing uploaded JSON log files. There is no backend — all processing, parsing, and visualization happens in the browser.

---

## Tech Stack

| Layer     | Technology                                                                        |
| --------- | --------------------------------------------------------------------------------- |
| Language  | **TypeScript**                                                                    |
| Framework | **React 19**                                                                      |
| Styling   | **Tailwind CSS** + **MUI (Material UI)**                                          |
| Charts    | **ApexCharts.js** ([react-apexcharts](https://apexcharts.com/docs/react-charts/)) |

---

## Application Layout

```
┌──────────────────────────────────────────────────┐
│  App Header / Title                              │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Vertical │   Active Tool Content Area            │
│  Tabs    │                                       │
│ (MUI)    │   ┌───────────────────────────────┐   │
│          │   │  JSON File Uploader           │   │
│  ● Tool1 │   └───────────────────────────────┘   │
│  ○ Tool2 │                                       │
│  ○ ...   │   ┌───────────────────────────────┐   │
│          │   │  Tool-specific UI             │   │
│          │   │  (charts, controls, etc.)     │   │
│          │   └───────────────────────────────┘   │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

### Navigation

- **Vertical Tabs** (left sidebar) based on [MUI Vertical Tabs](https://mui.com/material-ui/react-tabs/#vertical-tabs).
- Each tab corresponds to one **analyzing tool**.
- Switching tabs changes the entire content area.

### Per-Tool File Uploader

Every analyzing tool has its **own** `.json` file uploader at the top of its content area. Uploading a new file replaces the previously loaded data for that tool.

---

## Chart Features (Global — applies to all tools)

All charts across the app share the following capabilities:

### Interactive Features

| Feature              | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| **Tooltip on hover** | Shows exact values at each data point on hover.               |
| **Legend toggle**    | Clicking a series name in the legend hides/shows that series. |
| **Zoom & Pan**       | Native ApexCharts zoom/pan enabled on all time-series charts. |

### User-Defined Annotations

Users can add the following annotations to any chart at runtime:

| Annotation             | Description                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Point(s)**           | Mark specific (X, Y) coordinate(s) on the chart with a label.                              |
| **Vertical line(s)**   | Draw vertical line(s) at specific X (time) values — useful for marking events/deployments. |
| **Horizontal line(s)** | Draw horizontal line(s) at specific Y values — useful for thresholds or baselines.         |

> These leverage [ApexCharts Annotations API](https://apexcharts.com/docs/annotations/).

---

## Analyzing Tools

Tools are modular. Each tool is a self-contained React component registered in the vertical tabs. New tools can be added in the future without architectural changes.

---

### 1. Aeris Cache Statistics

**Purpose:** Visualize Aeris cache hit/miss statistics over time from JSON log entries.

#### Input Format

A `.json` file containing an **array of objects**. Each object has the structure:

```json
{
  "@timestamp": "2026-02-11 18:54:07.338",
  "@message": {
    "level": 30,
    "time": 1770836047338,
    "pid": 1,
    "hostname": "ip-172-30-9-161.ec2.internal",
    "msg": "Aeris cache stats",
    "runId": "47f217e1-2f48-4790-83f5-d8893bb7583a",
    "aerisCacheStats": {
      "hits": 0,
      "misses": 23,
      "cacheDeferredHits": 0,
      "aerisCalls": 23,
      "aerisAlertsCalls": 16,
      "aerisForecastsCalls": 0,
      "aerisAirQualityIndexCalls": 0
    }
  }
}
```

> **Note:** `@timestamp` is always **UTC**.

#### Available Metric Fields (Y-axis)

All numeric fields from `aerisCacheStats` are available as selectable series:

- `hits`
- `misses`
- `cacheDeferredHits`
- `aerisCalls`
- `aerisAlertsCalls`
- `aerisForecastsCalls`
- `aerisAirQualityIndexCalls`

Users can toggle which fields are displayed on the chart via checkboxes / multi-select.

#### Controls

##### Timezone Selector

- Timestamps are stored in UTC.
- A **timezone selector** allows the user to choose a display timezone.
- All X-axis labels, tooltips, and calendar inputs reflect the selected timezone.

##### Date/Time Range Selector

- A **calendar with time picker** for selecting the **start** and **end** of the data range.
- Filtering applies to all presentation types below.

#### Data Presentation Types

A selector (e.g., segmented button or dropdown) switches between three presentation modes:

---

##### a) All

- **Single chart** spanning the full selected range (start → end).
- X-axis: time (in selected timezone).
- Y-axis: selected metric field(s).

---

##### b) Daily

- **One chart per day** (00:00 → 23:59 in the selected timezone).
- Charts are stacked vertically (one per day in the range).
- **Synchronized X-axis scrolling:** scrolling/panning on one day's chart moves all other day charts to the same X position (same hour). This enables visual comparison of the same hour across different days.

---

##### c) Specific Hour

- A **hour selector** (0–23) lets the user pick a specific hour.
- The chart shows:
  - **X-axis:** dates from start to end (one tick per day).
  - **Y-axis:** the metric value(s) for the entry **nearest** to the selected hour on each day.
- **Nearest-entry matching:**
  - For a selected hour `H`, the app searches for the log entry closest to `H:00` within a configurable time window.
  - **Default window:** ±30 minutes (e.g., for hour 14 → search 13:30–14:30).
  - This window is **configurable** in the tool's settings / options panel.
  - If no entry exists within the window for a given day, that day's data point is omitted (gap in chart).

---

## Future Tools

> Additional analyzing tools will be added here as they are defined. Each follows the same pattern: vertical tab entry, dedicated JSON uploader, and tool-specific UI.
